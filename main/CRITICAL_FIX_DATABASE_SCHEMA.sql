-- CRITICAL FIX: Database Schema Issues
-- This fixes both user signup and booking registration problems
-- Run this IMMEDIATELY in your Supabase SQL editor

-- =============================================
-- 1. FIX USER PROFILE CREATION TRIGGER
-- =============================================

-- Drop and recreate the profile creation function with better error handling
DROP FUNCTION IF EXISTS create_profile_for_user() CASCADE;

CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
DECLARE
    first_name_val TEXT;
    last_name_val TEXT;
    full_name_val TEXT;
BEGIN
    -- Extract metadata safely
    first_name_val := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
    last_name_val := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
    
    -- Create full name
    IF first_name_val != '' AND last_name_val != '' THEN
        full_name_val := first_name_val || ' ' || last_name_val;
    ELSIF first_name_val != '' THEN
        full_name_val := first_name_val;
    ELSIF last_name_val != '' THEN
        full_name_val := last_name_val;
    ELSE
        full_name_val := NULL;
    END IF;

    -- Insert profile with error handling
    BEGIN
        INSERT INTO public.profiles (
            id, 
            email, 
            first_name, 
            last_name, 
            created_at, 
            updated_at
        ) VALUES (
            NEW.id,
            NEW.email,
            NULLIF(first_name_val, ''),
            NULLIF(last_name_val, ''),
            NOW(),
            NOW()
        );
    EXCEPTION 
        WHEN OTHERS THEN
            -- Log error but don't fail the user creation
            RAISE LOG 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
CREATE TRIGGER create_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_profile_for_user();

-- =============================================
-- 2. ADD MISSING BOOKING TABLES
-- =============================================

-- Drop existing booking tables if they exist (to avoid conflicts)
DROP TABLE IF EXISTS booking_reservations CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;

-- Create booking_reservations table
CREATE TABLE booking_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id VARCHAR(255) UNIQUE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60 NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'expired', 'cancelled')),
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    confirmed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_email VARCHAR(255) NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60 NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled', 'no_show')),
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    stripe_session_id VARCHAR(255) NULL,
    notes TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_booking_reservations_expires_at ON booking_reservations(expires_at);
CREATE INDEX idx_booking_reservations_date_time ON booking_reservations(booking_date, booking_time);
CREATE INDEX idx_booking_reservations_status ON booking_reservations(status);
CREATE INDEX idx_booking_reservations_product_id ON booking_reservations(product_id);

CREATE INDEX idx_bookings_date_time ON bookings(booking_date, booking_time);
CREATE INDEX idx_bookings_customer_email ON bookings(customer_email);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_product_id ON bookings(product_id);
CREATE INDEX idx_bookings_transaction_id ON bookings(transaction_id);

-- =============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE booking_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. CREATE RLS POLICIES
-- =============================================

-- Booking reservations policies (temporary holds - system managed)
CREATE POLICY "System can manage booking reservations" ON booking_reservations
    FOR ALL USING (true);

-- Bookings policies (users can see their own bookings)
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.email() = customer_email OR
        is_admin()
    );

CREATE POLICY "Admins can manage all bookings" ON bookings
    FOR ALL USING (is_admin());

CREATE POLICY "System can insert bookings" ON bookings
    FOR INSERT WITH CHECK (true);

-- =============================================
-- 6. ADD UPDATED_AT TRIGGERS
-- =============================================

CREATE TRIGGER update_booking_reservations_updated_at 
    BEFORE UPDATE ON booking_reservations 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON bookings 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================
-- 7. VERIFY EXISTING ADMIN STATS QUERIES WILL WORK
-- =============================================

-- Test that all required tables exist for admin dashboard
DO $$
BEGIN
    -- Check if all tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        RAISE EXCEPTION 'profiles table missing';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        RAISE EXCEPTION 'products table missing';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
        RAISE EXCEPTION 'transactions table missing';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
        RAISE EXCEPTION 'bookings table missing';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_reservations') THEN
        RAISE EXCEPTION 'booking_reservations table missing';
    END IF;
    
    RAISE NOTICE 'All required tables exist - schema is now consistent!';
END
$$;

-- =============================================
-- CLEANUP AND VERIFICATION
-- =============================================

-- Update existing transactions to link user_id from customer_email where possible
UPDATE transactions 
SET user_id = profiles.id 
FROM profiles 
WHERE transactions.customer_email = profiles.email 
AND transactions.user_id IS NULL;

-- Show table counts for verification
SELECT 
    'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 
    'products' as table_name, COUNT(*) as count FROM products
UNION ALL
SELECT 
    'transactions' as table_name, COUNT(*) as count FROM transactions
UNION ALL
SELECT 
    'bookings' as table_name, COUNT(*) as count FROM bookings
UNION ALL
SELECT 
    'booking_reservations' as table_name, COUNT(*) as count FROM booking_reservations;

-- Show transactions with and without user_id
SELECT 
    'transactions_with_user_id' as metric, 
    COUNT(*) as count 
FROM transactions 
WHERE user_id IS NOT NULL
UNION ALL
SELECT 
    'transactions_without_user_id' as metric, 
    COUNT(*) as count 
FROM transactions 
WHERE user_id IS NULL;

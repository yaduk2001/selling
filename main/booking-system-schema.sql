-- FILE: booking-system-schema.sql
-- Database schema for the booking system

-- Table for temporary booking reservations (15-minute holds)
CREATE TABLE IF NOT EXISTS booking_reservations (
    id BIGSERIAL PRIMARY KEY,
    reservation_id VARCHAR(255) UNIQUE NOT NULL,
    product_id BIGINT NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60 NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'expired', 'cancelled')),
    transaction_id BIGINT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for confirmed bookings
CREATE TABLE IF NOT EXISTS bookings (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    user_id UUID NULL,
    customer_email VARCHAR(255) NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60 NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled', 'no_show')),
    transaction_id BIGINT NULL,
    stripe_session_id VARCHAR(255) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: Removed UNIQUE constraint on (booking_date, booking_time) since we now support 
-- different duration bookings that may overlap. Conflict checking is handled in the application.

-- Table for calendar events (optional - for admin calendar view)
CREATE TABLE IF NOT EXISTS calendar_events (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    booking_id BIGINT NULL,
    transaction_id BIGINT NULL,
    customer_email VARCHAR(255) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_booking_reservations_expires_at ON booking_reservations(expires_at);
CREATE INDEX IF NOT EXISTS idx_booking_reservations_date_time ON booking_reservations(booking_date, booking_time);
CREATE INDEX IF NOT EXISTS idx_booking_reservations_status ON booking_reservations(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON bookings(booking_date, booking_time);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);

-- RLS Policies for security (if using Row Level Security)
-- Enable RLS
ALTER TABLE booking_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Service role can manage bookings" ON bookings;
DROP POLICY IF EXISTS "Service role can manage reservations" ON booking_reservations;
DROP POLICY IF EXISTS "Service role can manage calendar events" ON calendar_events;

-- Policy: Users can only see their own bookings
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT USING (auth.uid() = user_id OR auth.email() = customer_email);

-- Policy: Service role can manage all bookings
CREATE POLICY "Service role can manage bookings" ON bookings
    FOR ALL USING (auth.role() = 'service_role');

-- Policy: Service role can manage all reservations
CREATE POLICY "Service role can manage reservations" ON booking_reservations
    FOR ALL USING (auth.role() = 'service_role');

-- Policy: Service role can manage calendar events
CREATE POLICY "Service role can manage calendar events" ON calendar_events
    FOR ALL USING (auth.role() = 'service_role');

-- Cleanup function to remove expired reservations
CREATE OR REPLACE FUNCTION cleanup_expired_reservations()
RETURNS void AS $$
BEGIN
    UPDATE booking_reservations 
    SET status = 'expired' 
    WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to run cleanup every 5 minutes
-- This would typically be done in your application or via pg_cron extension
-- SELECT cron.schedule('cleanup-expired-reservations', '*/5 * * * *', 'SELECT cleanup_expired_reservations();');

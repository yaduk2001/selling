-- SECURE BOOKING-USER LINKING FIX
-- This adds a secure token system to link bookings with new user accounts
-- Run this in Supabase SQL Editor

-- =============================================
-- STEP 1: ADD SECURE BOOKING TOKEN COLUMN
-- =============================================

-- Add a secure booking token to booking_reservations table
ALTER TABLE booking_reservations ADD COLUMN IF NOT EXISTS booking_token VARCHAR(64) UNIQUE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_booking_reservations_token ON booking_reservations(booking_token);

-- Add a secure booking token to transactions table  
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS booking_token VARCHAR(64) UNIQUE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_transactions_booking_token ON transactions(booking_token);

-- =============================================
-- STEP 2: CREATE SECURE TOKEN GENERATION FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION generate_secure_booking_token()
RETURNS TEXT AS $$
DECLARE
    token TEXT;
    counter INT := 0;
BEGIN
    LOOP
        -- Generate a secure random token
        token := encode(gen_random_bytes(32), 'hex');
        
        -- Check if token already exists in booking_reservations
        IF NOT EXISTS (SELECT 1 FROM booking_reservations WHERE booking_token = token) 
           AND NOT EXISTS (SELECT 1 FROM transactions WHERE booking_token = token) THEN
            RETURN token;
        END IF;
        
        counter := counter + 1;
        
        -- Prevent infinite loop (extremely unlikely)
        IF counter > 100 THEN
            RAISE EXCEPTION 'Unable to generate unique booking token';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- STEP 3: UPDATE EXISTING RESERVATIONS WITH TOKENS
-- =============================================

-- Add tokens to existing reservations that don't have them
UPDATE booking_reservations 
SET booking_token = generate_secure_booking_token()
WHERE booking_token IS NULL;

-- Add tokens to existing transactions that don't have them  
UPDATE transactions 
SET booking_token = generate_secure_booking_token()
WHERE booking_token IS NULL;

-- =============================================
-- STEP 4: CREATE FUNCTION TO LINK USER TO BOOKING SECURELY
-- =============================================

CREATE OR REPLACE FUNCTION link_user_to_booking(
    p_user_id UUID,
    p_email TEXT,
    p_booking_token TEXT
)
RETURNS JSON AS $$
DECLARE
    v_transaction_id UUID;
    v_reservation_id UUID;
    v_result JSON;
    v_updated_count INT := 0;
BEGIN
    -- Verify user email matches the booking email
    -- Find transaction by booking token and verify email
    SELECT id INTO v_transaction_id
    FROM transactions 
    WHERE booking_token = p_booking_token 
    AND LOWER(customer_email) = LOWER(p_email);
    
    IF v_transaction_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid booking token or email mismatch'
        );
    END IF;
    
    -- Update transaction with user_id
    UPDATE transactions 
    SET user_id = p_user_id,
        updated_at = NOW()
    WHERE id = v_transaction_id;
    
    v_updated_count := v_updated_count + 1;
    
    -- Update related booking reservation
    UPDATE booking_reservations 
    SET booking_token = p_booking_token,
        updated_at = NOW()
    WHERE transaction_id = v_transaction_id;
    
    -- Update any existing bookings
    UPDATE bookings 
    SET user_id = p_user_id,
        updated_at = NOW()
    WHERE transaction_id = v_transaction_id;
    
    -- Return success
    RETURN json_build_object(
        'success', true,
        'message', 'Booking successfully linked to user account',
        'transaction_id', v_transaction_id,
        'updates_made', v_updated_count
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STEP 5: GRANT PERMISSIONS
-- =============================================

GRANT EXECUTE ON FUNCTION generate_secure_booking_token() TO service_role;
GRANT EXECUTE ON FUNCTION generate_secure_booking_token() TO authenticated;
GRANT EXECUTE ON FUNCTION link_user_to_booking(UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION link_user_to_booking(UUID, TEXT, TEXT) TO authenticated;

-- =============================================
-- STEP 6: VERIFICATION
-- =============================================

DO $$
BEGIN
    -- Verify the new columns exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'booking_reservations' 
        AND column_name = 'booking_token'
    ) THEN
        RAISE NOTICE '✅ booking_token column added to booking_reservations';
    ELSE
        RAISE NOTICE '❌ booking_token column missing from booking_reservations';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'booking_token'
    ) THEN
        RAISE NOTICE '✅ booking_token column added to transactions';
    ELSE
        RAISE NOTICE '❌ booking_token column missing from transactions';
    END IF;
    
    -- Verify functions exist
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'generate_secure_booking_token'
    ) THEN
        RAISE NOTICE '✅ generate_secure_booking_token function created';
    ELSE
        RAISE NOTICE '❌ generate_secure_booking_token function missing';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'link_user_to_booking'
    ) THEN
        RAISE NOTICE '✅ link_user_to_booking function created';
    ELSE
        RAISE NOTICE '❌ link_user_to_booking function missing';
    END IF;
END $$;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '🎉 SECURE BOOKING-USER LINKING SYSTEM INSTALLED!';
    RAISE NOTICE '📝 Changes made:';
    RAISE NOTICE '   - Added booking_token columns with indexes';
    RAISE NOTICE '   - Created secure token generation function';  
    RAISE NOTICE '   - Created secure user-booking linking function';
    RAISE NOTICE '   - Updated existing records with tokens';
    RAISE NOTICE '🔒 Security: Only users with correct email + token can claim bookings';
    RAISE NOTICE '📋 Next: Update your API routes to use the new secure system';
END $$;

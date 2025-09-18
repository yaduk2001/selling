-- QUICK FIX: Add booking_token columns
-- Run this IMMEDIATELY in Supabase SQL Editor to fix booking reservation errors

-- Add booking_token column to booking_reservations table
ALTER TABLE booking_reservations ADD COLUMN IF NOT EXISTS booking_token VARCHAR(64);

-- Add booking_token column to transactions table  
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS booking_token VARCHAR(64);

-- Add booking_token column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_token VARCHAR(64);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_reservations_token ON booking_reservations(booking_token);
CREATE INDEX IF NOT EXISTS idx_transactions_booking_token ON transactions(booking_token);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_token ON bookings(booking_token);

-- Verification
SELECT 
    'booking_reservations' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'booking_reservations' 
    AND column_name = 'booking_token'
UNION ALL
SELECT 
    'transactions' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'transactions' 
    AND column_name = 'booking_token'
UNION ALL
SELECT 
    'bookings' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'bookings' 
    AND column_name = 'booking_token';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ BOOKING TOKEN COLUMNS ADDED!';
    RAISE NOTICE '📝 booking_token column added to all tables';
    RAISE NOTICE '🔍 Indexes created for performance';
    RAISE NOTICE '🧪 Test booking reservation now';
END $$;

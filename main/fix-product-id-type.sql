-- FILE: fix-product-id-type.sql
-- Fix product_id column type mismatch from BIGINT to UUID

-- Update booking_reservations table
ALTER TABLE booking_reservations 
ALTER COLUMN product_id TYPE UUID USING product_id::text::uuid;

-- Update bookings table  
ALTER TABLE bookings
ALTER COLUMN product_id TYPE UUID USING product_id::text::uuid;

-- Update calendar_events table if it exists
ALTER TABLE calendar_events
ALTER COLUMN transaction_id TYPE UUID USING transaction_id::text::uuid;

-- Note: Run this in your Supabase SQL editor to fix the data type mismatch

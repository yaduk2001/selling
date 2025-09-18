-- TEST: Create sample booking data to verify the system works
-- Run this in Supabase SQL editor to test the booking system

-- First, let's see what transactions exist
SELECT 
    t.id,
    t.customer_email,
    t.user_id,
    t.product_id,
    t.status,
    t.stripe_session_id,
    p.name as product_name,
    p.type as product_type,
    p.price
FROM transactions t
JOIN products p ON t.product_id = p.id
WHERE t.status = 'completed'
ORDER BY t.created_at DESC
LIMIT 5;

-- Create a test booking for one of the existing completed transactions
-- (Replace the UUIDs with actual values from your transactions)
INSERT INTO bookings (
    product_id,
    user_id,
    customer_email,
    booking_date,
    booking_time,
    duration_minutes,
    status,
    transaction_id,
    stripe_session_id,
    notes,
    created_at
)
SELECT 
    t.product_id,
    t.user_id,
    t.customer_email,
    CURRENT_DATE + INTERVAL '7 days' as booking_date, -- Book for next week
    '14:00:00' as booking_time,
    60 as duration_minutes,
    'confirmed' as status,
    t.id as transaction_id,
    t.stripe_session_id,
    'Test booking created manually to verify system' as notes,
    NOW() as created_at
FROM transactions t
WHERE t.status = 'completed' 
AND t.customer_email = 'bamalekh@gmail.com'
LIMIT 1;

-- Verify the booking was created
SELECT 
    b.*,
    p.name as product_name,
    p.type as product_type
FROM bookings b
JOIN products p ON b.product_id = p.id
WHERE b.customer_email = 'bamalekh@gmail.com';

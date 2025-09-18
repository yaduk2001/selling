#!/bin/bash

echo "Testing payment callback system..."

# First, let's check what pending reservations we have
echo "Checking booking reservations status..."
curl -X GET http://localhost:3000/api/confirm-bookings

echo -e "\n\nChecking user bookings before callback..."
curl -X GET "http://localhost:3000/api/user-bookings?user_id=2a71682d-fd4c-4220-849d-d00b5ad36b41&email=bamalekh%40gmail.com"

echo -e "\n\nNow testing payment callback with a sample session ID..."
# You can replace this with an actual Stripe session ID from your transactions
echo "Note: Replace 'cs_test_sample' with a real session ID from your database"

# Example call (replace session ID with real one):
# curl -X POST http://localhost:3000/api/payment-callback \
#   -H "Content-Type: application/json" \
#   -d '{
#     "sessionId": "cs_test_your_real_session_id",
#     "userId": "2a71682d-fd4c-4220-849d-d00b5ad36b41",
#     "userEmail": "bamalekh@gmail.com"
#   }'

echo -e "\n\nTo test with real data:"
echo "1. Find a Stripe session ID from your transactions table"
echo "2. Run: curl -X POST http://localhost:3000/api/payment-callback -H 'Content-Type: application/json' -d '{\"sessionId\":\"YOUR_SESSION_ID\",\"userId\":\"2a71682d-fd4c-4220-849d-d00b5ad36b41\",\"userEmail\":\"bamalekh@gmail.com\"}'"
echo "3. Check bookings again to see if they're confirmed"

echo -e "\n\nTest complete!"

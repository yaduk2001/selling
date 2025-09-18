#!/bin/bash

echo "Testing booking flow by creating test data..."

# Test 1: Create a test booking reservation
echo "Creating test booking reservation..."
curl -X POST http://localhost:3000/api/booking/reserve-slot \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "uuid-of-coaching-product",
    "date": "2025-08-20",
    "time": "14:00",
    "duration": 60
  }'

echo -e "\n\nChecking booking status..."
curl -X GET http://localhost:3000/api/confirm-bookings

echo -e "\n\nChecking user bookings..."
curl -X GET "http://localhost:3000/api/user-bookings?user_id=2a71682d-fd4c-4220-849d-d00b5ad36b41&email=bamalekh%40gmail.com"

echo -e "\n\nTest complete!"

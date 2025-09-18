#!/bin/bash

# Test script to verify webhook functionality
echo "🧪 Testing Webhook Functionality"
echo "=================================="

# Check if Next.js is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Next.js server is not running on localhost:3000"
    echo "Please run: npm run dev"
    exit 1
fi

echo "✅ Next.js server is running"

# Test webhook endpoint
echo "🔗 Testing webhook endpoint..."
curl -X POST http://localhost:3000/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "evt_test_webhook",
    "object": "event",
    "api_version": "2020-08-27",
    "created": 1234567890,
    "data": {
      "object": {
        "id": "cs_test_session",
        "object": "checkout.session",
        "metadata": {
          "reservationId": "test_reservation",
          "bookingDate": "2025-08-20",
          "bookingTime": "10:00",
          "duration": "60"
        },
        "customer_details": {
          "email": "test@example.com"
        }
      }
    },
    "livemode": false,
    "pending_webhooks": 1,
    "request": {
      "id": null,
      "idempotency_key": null
    },
    "type": "checkout.session.completed"
  }' || echo "⚠️  Webhook test request failed (expected without proper signature)"

echo ""
echo "🔍 Check the Next.js terminal logs for webhook processing details"
echo "📋 Next steps:"
echo "   1. Run the database schema fix in Supabase"
echo "   2. Test a real booking flow"
echo "   3. Check admin dashboard for data"

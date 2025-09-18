# SECURE BOOKING-USER LINKING SYSTEM

## Overview
This system ensures that when a user creates an account after booking, their booking is securely tied to their new account using unique booking tokens, preventing unauthorized access to other people's bookings.

## How It Works

### 1. Booking Token Generation
- When a booking reservation is created (`/api/booking/reserve-slot`), a unique 64-character booking token is generated
- This token is stored in the `booking_reservations` table
- The token is cryptographically secure and unique

### 2. Payment Confirmation & Token Propagation
- When payment is successful (`/api/payment-callback`):
  - The booking token is copied from reservation to the transaction record
  - The booking token is copied from reservation to the booking record
  - This ensures all related records have the same token

### 3. Account Setup with Secure Linking
- When user goes to account setup after purchase (`/account-setup`):
  - The booking token is passed via URL parameters
  - User creates their account normally
  - After account creation, the token-based linking is triggered

### 4. Secure Account-Booking Link
- The `/api/link-account-purchase` API now supports two methods:
  - **Secure token-based linking** (preferred): Uses booking token + email verification
  - **Session-based linking** (fallback): Uses Stripe session ID

### 5. Security Features
- **Email Verification**: Token linking only works if the email matches
- **Unique Tokens**: Each booking has a unique, unguessable token
- **Double Security Check**: Both booking token AND email must match
- **No Cross-Contamination**: Users can only claim bookings paid for with their email

## Database Changes Required

Run this SQL in Supabase to enable the system:

```sql
-- Add booking_token columns
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS booking_token VARCHAR(64) UNIQUE;
ALTER TABLE booking_reservations ADD COLUMN IF NOT EXISTS booking_token VARCHAR(64) UNIQUE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_token VARCHAR(64) UNIQUE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_booking_token ON transactions(booking_token);
CREATE INDEX IF NOT EXISTS idx_booking_reservations_booking_token ON booking_reservations(booking_token);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_token ON bookings(booking_token);
```

## API Changes Made

### 1. `/api/booking/reserve-slot`
- ✅ Already generates booking tokens
- ✅ Stores tokens in booking_reservations table

### 2. `/api/payment-callback`
- ✅ Updated to propagate booking tokens to transactions and bookings
- ✅ Returns booking token in response for account setup

### 3. `/api/link-account-purchase`
- ✅ Added secure token-based linking function
- ✅ Maintains backward compatibility with session-based linking
- ✅ Includes email verification for security

### 4. `/success` page
- ✅ Updated to capture booking token from payment callback
- ✅ Passes booking token to account setup page

### 5. `/account-setup` page
- ✅ Captures booking token from URL parameters
- ✅ Uses token for secure account-booking linking
- ✅ Shows visual confirmation when token is present

## Flow Diagram

```
1. User books coaching session
   ↓
2. Booking reservation created with unique token
   ↓
3. User pays via Stripe
   ↓
4. Payment callback propagates token to transaction & booking
   ↓
5. User redirected to account setup with token
   ↓
6. User creates account
   ↓
7. Account securely linked to booking via token + email verification
   ↓
8. User can now access their booking in dashboard
```

## Security Benefits

1. **Prevents Unauthorized Access**: Users cannot claim other people's bookings
2. **Email Verification**: Additional security layer requiring email match
3. **Unique Tokens**: Each booking has a cryptographically secure unique identifier
4. **No Guessable IDs**: Unlike sequential IDs, tokens cannot be guessed
5. **Time-Limited Exposure**: Tokens are only exposed during account setup flow

## Testing

To test the system:
1. Book a coaching session (without being logged in)
2. Complete payment via Stripe
3. On success page, should be redirected to account setup with booking token
4. Create new account - should automatically link to the booking
5. Check dashboard - booking should appear under user's account
6. Verify in database that booking has correct user_id

## Fallback Support

The system maintains backward compatibility:
- If no booking token is available, falls back to session-based linking
- Works for both new bookings (with tokens) and legacy bookings (without tokens)
- Gracefully handles missing tokens without breaking the flow

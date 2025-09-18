# Client-Side Pre-Payment Booking Flow Implementation

## Overview
This implementation provides a complete booking system where customers can select specific time slots for coaching sessions before completing payment, with a temporary reservation system to prevent conflicts. **Now supports flexible booking durations** including 30-minute, 60-minute, and custom duration sessions.

## System Components

### 1. Frontend Components

#### BookingModal (`/src/app/components/BookingModal.js`)
- Interactive calendar for date/time selection with **duration-aware slot generation**
- Real-time availability checking considering **booking duration overlaps**
- 15-minute slot reservation with countdown timer
- **Dynamic slot display** showing start and end times
- Seamless transition to Stripe checkout

#### Updated Pricing Component (`/src/app/components/home/Pricing.js`)
- Differentiates between PDF and coaching products
- Opens booking modal for coaching sessions
- **Shows product duration in booking interface**
- Regular purchase flow for PDF products

### 2. Backend API Routes

#### Availability API (`/api/booking/availability`)
- `GET /api/booking/availability?date=YYYY-MM-DD&productId=123&duration=60`
- Returns available time slots for a specific date **considering booking duration**
- **Intelligent conflict detection** - prevents overlapping bookings of different durations
- **Dynamic slot generation** based on session length

#### Reservation API (`/api/booking/reserve-slot`)
- `POST /api/booking/reserve-slot`
- Creates 15-minute temporary reservations **with duration tracking**
- **Advanced conflict prevention** for overlapping time periods
- Supports any booking duration (30, 60, 90, 120 minutes, etc.)

#### Updated Stripe Integration
- Enhanced checkout session creation with booking metadata
- Webhook handling for booking confirmation
- Automatic account creation post-payment

### 3. Database Schema

#### Tables Created:
1. **`booking_reservations`** - Temporary 15-minute holds **with duration tracking**
2. **`bookings`** - Confirmed bookings after payment **with session duration**
3. **`calendar_events`** - Optional admin calendar view
4. **`products`** - Enhanced with `duration_minutes` field for flexible session lengths

## New Duration Features

### ✅ Flexible Session Lengths
- **30-minute sessions** - Quick consultations
- **60-minute sessions** - Standard coaching (default)
- **90-minute sessions** - Extended coaching
- **120+ minute sessions** - Deep-dive sessions
- **Custom durations** - Any length you define

### ✅ Smart Conflict Detection
- **Overlap prevention** - 30-min session at 2:00 PM blocks 2:30 PM slot for 60-min bookings
- **Duration-aware availability** - Shows only compatible time slots
- **Real-time conflict checking** - Prevents double bookings across different durations

## User Flow

### Phase 1: Time Selection
1. User clicks "📅 Book Coaching Session" 
2. Booking modal opens with calendar
3. System fetches real-time availability
4. User selects date and time

### Phase 2: Temporary Reservation
1. API creates 15-minute reservation
2. UI shows countdown timer
3. "Proceed to Payment" button activates
4. Slot is held from other users

### Phase 3: Checkout Process
1. Stripe session created with booking metadata
2. User redirected to secure payment
3. Reservation ID passed to Stripe

### Phase 4: Confirmation
1. Webhook confirms payment
2. Reservation converted to confirmed booking
3. Account creation (if new user)
4. Success page with booking details

## Key Features

### ✅ Conflict Prevention
- Real-time availability checking
- Temporary reservations prevent double-booking
- Automatic expiration of unused reservations

### ✅ User Experience
- No account required for booking
- Visual countdown timer
- Clear booking confirmation
- Seamless payment integration

### ✅ Admin Management
- All bookings tracked in database
- Calendar events for scheduling
- Transaction linking for accounting

## API Endpoints

### Get Availability (Enhanced)
```javascript
GET /api/booking/availability?date=2025-08-20&productId=1&duration=60
Response: {
  success: true,
  availableSlots: [
    { 
      time: "09:00", 
      available: true, 
      duration: 60,
      endTime: "10:00" 
    },
    { 
      time: "10:30", 
      available: true, 
      duration: 60,
      endTime: "11:30" 
    }
    // ... more slots with start/end times
  ],
  duration: 60
}
```

### Reserve Slot (Enhanced)
```javascript
POST /api/booking/reserve-slot
Body: {
  productId: 1,
  bookingDate: "2025-08-20",
  bookingTime: "10:00",
  duration: 60
}
Response: {
  success: true,
  reservationId: "res_1692547200_abc123",
  expiresAt: "2025-08-20T10:15:00Z",
  duration: 60,
  message: "60-minute slot reserved successfully"
}
```

### Enhanced Checkout
```javascript
POST /api/stripe/checkout-session
Body: {
  productId: 1,
  reservationId: "res_1692547200_abc123",
  bookingDate: "2025-08-20",
  bookingTime: "10:00",
  duration: 60
}
```

## Database Setup

1. **Run the main schema:**
```bash
psql -d your_database -f booking-system-schema.sql
```

2. **Run the duration migration (for existing installations):**
```bash
psql -d your_database -f booking-duration-migration.sql
```

3. **Configure product durations:**
```sql
-- Set different session durations for your coaching products
UPDATE products SET duration_minutes = 30 WHERE name LIKE '%Quick%';
UPDATE products SET duration_minutes = 60 WHERE name LIKE '%Standard%'; -- Default
UPDATE products SET duration_minutes = 90 WHERE name LIKE '%Extended%';
UPDATE products SET duration_minutes = 120 WHERE name LIKE '%Deep%';
```

## Duration Configuration Examples

### Product Types & Durations
- **Quick Consultation** - 30 minutes - $50
- **Standard Coaching** - 60 minutes - $100 (default)
- **Extended Session** - 90 minutes - $140
- **Deep Dive Strategy** - 120 minutes - $180

### Time Slot Examples
For a **30-minute booking** at 2:00 PM:
- Available slots: 9:00, 9:30, 10:00, 10:30, 11:00, 11:30, 12:00, 12:30, 1:00, 1:30, **2:00**, 2:30, 3:00, 3:30, 4:00, 4:30
- After booking: **2:00-2:30** blocked, but 2:30-3:00 still available for other 30-min bookings

For a **60-minute booking** at 2:00 PM:
- Available slots: 9:00, 10:00, 11:00, 12:00, 1:00, **2:00**, 3:00, 4:00
- After booking: **2:00-3:00** fully blocked, 3:00 available for next booking

## Security Features

- Row Level Security (RLS) policies
- Service role permissions for API operations
- Automatic cleanup of expired reservations
- Input validation and error handling

## Monitoring & Maintenance

### Automated Cleanup
The system includes a cleanup function for expired reservations:
```sql
SELECT cleanup_expired_reservations();
```

### Recommended Monitoring
- Track reservation-to-booking conversion rates
- Monitor expired reservations
- Alert on booking conflicts
- Track user journey completion

## Integration Notes

### Existing System Compatibility
- Works with existing product/pricing system
- Compatible with current Stripe integration
- Maintains existing account creation flow
- No changes needed to existing PDF purchase flow

### Future Enhancements
- Multiple time slot durations
- Recurring booking patterns
- Booking cancellation/rescheduling
- Admin calendar management interface
- Email notifications and reminders

## Testing

### Test Scenarios
1. **Happy Path**: Select time → Reserve → Pay → Confirm
2. **Reservation Expiry**: Let countdown expire, verify slot returns
3. **Conflict Prevention**: Two users try same slot simultaneously  
4. **Payment Failure**: Verify reservation is released
5. **Account Creation**: Verify seamless post-payment setup

### Test Data
The system generates available slots from 9 AM to 5 PM daily for the next 30 days. Customize the time range in the BookingModal component as needed.

This implementation provides a robust, user-friendly booking system that prevents conflicts while maintaining the seamless purchase experience your users expect.

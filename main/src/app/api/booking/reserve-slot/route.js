// FILE: src/app/api/booking/reserve-slot/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { convertBookingToUTC, convertUTCToLocal } from '@/lib/timezone-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { productId, bookingDate, bookingTime, duration = 60, timezone = 'UTC' } = await request.json();

    if (!productId || !bookingDate || !bookingTime) {
      return NextResponse.json(
        { success: false, error: 'Product ID, date, and time are required' },
        { status: 400 }
      );
    }

    // Check if slot is still available (considering duration overlap)
    let conflictingBookings = [];
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select('booking_time, duration_minutes')
      .eq('booking_date', bookingDate)
      .eq('status', 'confirmed');

    if (bookingError && bookingError.code === '42703') {
      // Fallback if duration_minutes doesn't exist
      const { data: fallbackData } = await supabase
        .from('bookings')
        .select('booking_time')
        .eq('booking_date', bookingDate)
        .eq('status', 'confirmed');
      
      conflictingBookings = (fallbackData || []).map(b => ({
        ...b,
        duration_minutes: 60
      }));
    } else if (!bookingError) {
      conflictingBookings = bookingData || [];
    }

    if (hasBookingConflict(bookingTime, duration, conflictingBookings)) {
      return NextResponse.json(
        { success: false, error: 'Time slot conflicts with existing booking' },
        { status: 409 }
      );
    }

    // Check for unexpired reservations
    let conflictingReservations = [];
    const { data: reservationData, error: reservationError } = await supabase
      .from('booking_reservations')
      .select('booking_time, duration_minutes')
      .eq('booking_date', bookingDate)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString());

    if (reservationError && reservationError.code === '42703') {
      // Fallback if duration_minutes doesn't exist
      const { data: fallbackData } = await supabase
        .from('booking_reservations')
        .select('booking_time')
        .eq('booking_date', bookingDate)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());
      
      conflictingReservations = (fallbackData || []).map(r => ({
        ...r,
        duration_minutes: 60
      }));
    } else if (!reservationError) {
      conflictingReservations = reservationData || [];
    }

    if (hasBookingConflict(bookingTime, duration, conflictingReservations)) {
      return NextResponse.json(
        { success: false, error: 'Time slot conflicts with existing reservation' },
        { status: 409 }
      );
    }

    // Check for busy slots from calendar_events
    let conflictingBusySlots = [];
    // Use same timezone logic as admin calendar API
    const dayBefore = new Date(bookingDate);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const dayAfter = new Date(bookingDate);
    dayAfter.setDate(dayAfter.getDate() + 1);
    
    const searchStartUTC = dayBefore.toISOString().split('T')[0] + 'T00:00:00.000Z';
    const searchEndUTC = dayAfter.toISOString().split('T')[0] + 'T23:59:59.999Z';
    
    const { data: allBusyData, error: busyError } = await supabase
      .from('calendar_events')
      .select('start_time, end_time')
      .gte('start_time', searchStartUTC)
      .lte('start_time', searchEndUTC);

    if (!busyError && allBusyData) {
      // Filter events to only include those that occur on the requested local date
      const busyData = allBusyData.filter(slot => {
        const startTimeLocal = new Date(slot.start_time);
        const localDateString = startTimeLocal.toLocaleDateString('en-CA'); // YYYY-MM-DD format
        return localDateString === bookingDate;
      });
      
      // Convert busy slots to the same format as bookings
      conflictingBusySlots = busyData.map(slot => {
        const startTime = new Date(slot.start_time);
        const endTime = new Date(slot.end_time);
        const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
        const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
        const duration_minutes = endMinutes - startMinutes;
        
        return {
          booking_time: `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`,
          duration_minutes
        };
      });
    }

    if (hasBookingConflict(bookingTime, duration, conflictingBusySlots)) {
      return NextResponse.json(
        { success: false, error: 'Time slot is not available (busy)' },
        { status: 409 }
      );
    }

    // Create reservation (15 minutes from now)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const reservationId = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate secure booking token for later account linking
    const bookingToken = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');

    // Try to insert with all columns, fall back if columns don't exist
    let reservation, error;
    try {
      const insertData = {
        reservation_id: reservationId,
        product_id: productId, // Use original UUID
        booking_date: bookingDate,
        booking_time: bookingTime,
        duration_minutes: duration,
        booking_token: bookingToken,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      };

      const result = await supabase
        .from('booking_reservations')
        .insert([insertData])
        .select()
        .single();
      
      reservation = result.data;
      error = result.error;
    } catch (insertError) {
      if (insertError.code === '42703' || (insertError.message && insertError.message.includes('booking_token'))) {
        // booking_token column doesn't exist, try without it
        console.log('booking_token column not found, inserting without token');
        try {
          const insertDataWithoutToken = {
            reservation_id: reservationId,
            product_id: productId,
            booking_date: bookingDate,
            booking_time: bookingTime,
            duration_minutes: duration,
            status: 'pending',
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString()
          };

          const result = await supabase
            .from('booking_reservations')
            .insert([insertDataWithoutToken])
            .select()
            .single();
          
          reservation = result.data;
          error = result.error;
          
          // Add the token to the response even if not stored in DB
          if (reservation) {
            reservation.booking_token = bookingToken;
          }
        } catch (secondError) {
          if (secondError.code === '42703' || (secondError.message && secondError.message.includes('duration_minutes'))) {
            // Both booking_token and duration_minutes columns don't exist
            console.log('duration_minutes column also not found, inserting basic reservation');
            const basicInsertData = {
              reservation_id: reservationId,
              product_id: productId,
              booking_date: bookingDate,
              booking_time: bookingTime,
              status: 'pending',
              expires_at: expiresAt.toISOString(),
              created_at: new Date().toISOString()
            };

            const result = await supabase
              .from('booking_reservations')
              .insert([basicInsertData])
              .select()
              .single();
            
            reservation = result.data;
            error = result.error;
            
            // Add missing fields to the response
            if (reservation) {
              reservation.booking_token = bookingToken;
              reservation.duration_minutes = duration;
            }
          } else {
            error = secondError;
          }
        }
      } else {
        error = insertError;
      }
    }

    if (error) {
      console.error('Error creating reservation:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to reserve slot' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reservationId,
      bookingToken,
      expiresAt: expiresAt.toISOString(),
      duration,
      message: `${duration}-minute slot reserved successfully`
    });

  } catch (error) {
    console.error('Reserve slot API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Check if a proposed booking conflicts with existing bookings
function hasBookingConflict(proposedTime, proposedDuration, existingBookings) {
  const proposedStart = timeToMinutes(proposedTime);
  const proposedEnd = proposedStart + proposedDuration;
  
  for (const booking of existingBookings) {
    const bookingStart = timeToMinutes(booking.booking_time);
    const bookingDuration = booking.duration_minutes || 60;
    const bookingEnd = bookingStart + bookingDuration;
    
    // Check for overlap
    if (proposedStart < bookingEnd && proposedEnd > bookingStart) {
      return true; // Conflict found
    }
  }
  
  return false; // No conflict
}

// Convert time string (HH:MM) to minutes since midnight
function timeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

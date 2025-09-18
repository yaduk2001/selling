// FILE: src/app/api/booking/availability/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { convertLocalToUTC, convertUTCToLocal, formatTimeForAPI } from '@/lib/timezone-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const productId = searchParams.get('productId');
    const duration = parseInt(searchParams.get('duration')) || 60; // Default 60 minutes
    const timezone = searchParams.get('timezone') || 'UTC'; // User's timezone

    if (!date || !productId) {
      return NextResponse.json(
        { success: false, error: 'Date and product ID are required' },
        { status: 400 }
      );
    }

    // Fetch business hours for the requested date
    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    let businessHoursForDay = null;
    try {
      const { data: businessHoursData, error: businessHoursError } = await supabase
        .from('business_hours')
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .single();

      if (businessHoursError) {
        console.error('Error fetching business hours:', businessHoursError);
        // Fall back to default hours if no business hours found
        businessHoursForDay = {
          is_working_day: dayOfWeek >= 1 && dayOfWeek <= 5, // Monday to Friday
          start_time: '09:00:00',
          end_time: '17:00:00'
        };
      } else {
        businessHoursForDay = businessHoursData;
      }
    } catch (error) {
      console.error('Error in business hours fetch:', error);
      // Fall back to default hours
      businessHoursForDay = {
        is_working_day: dayOfWeek >= 1 && dayOfWeek <= 5, // Monday to Friday
        start_time: '09:00:00',
        end_time: '17:00:00'
      };
    }

    // If it's not a working day, return empty slots
    if (!businessHoursForDay.is_working_day) {
      return NextResponse.json({
        success: true,
        availableSlots: [],
        date,
        duration,
        message: 'No availability on this day'
      });
    }

    // Generate time slots based on duration and business hours
    const allSlots = generateTimeSlots(duration, businessHoursForDay.start_time, businessHoursForDay.end_time);

    // Fetch confirmed bookings for this date
    let confirmedBookings = [];
    try {
      const { data: confirmedData, error: confirmedError } = await supabase
        .from('bookings')
        .select('booking_time, duration_minutes')
        .eq('booking_date', date)
        .eq('status', 'confirmed');

      if (confirmedError) {
        console.error('Error fetching confirmed bookings:', confirmedError);
        // If duration_minutes column doesn't exist, fall back to basic query
        if (confirmedError.code === '42703') {
          const { data: fallbackBookings, error: fallbackError } = await supabase
            .from('bookings')
            .select('booking_time')
            .eq('booking_date', date)
            .eq('status', 'confirmed');
          
          if (fallbackError) {
            return NextResponse.json(
              { success: false, error: 'Failed to fetch bookings' },
              { status: 500 }
            );
          }
          
          // Map fallback bookings to include default duration
          confirmedBookings = (fallbackBookings || []).map(booking => ({
            ...booking,
            duration_minutes: 60 // Default to 60 minutes
          }));
        } else {
          return NextResponse.json(
            { success: false, error: 'Failed to fetch bookings' },
            { status: 500 }
          );
        }
      } else {
        confirmedBookings = confirmedData || [];
      }
    } catch (error) {
      console.error('Error in confirmed bookings fetch:', error);
      confirmedBookings = [];
    }

    // Fetch pending/reserved bookings that haven't expired
    let pendingBookings = [];
    try {
      const { data: pendingData, error: pendingError } = await supabase
        .from('booking_reservations')
        .select('booking_time, duration_minutes')
        .eq('booking_date', date)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      if (pendingError) {
        console.error('Error fetching pending bookings:', pendingError);
        // If duration_minutes column doesn't exist, fall back to basic query
        if (pendingError.code === '42703') {
          const { data: fallbackReservations, error: fallbackError } = await supabase
            .from('booking_reservations')
            .select('booking_time')
            .eq('booking_date', date)
            .eq('status', 'pending')
            .gt('expires_at', new Date().toISOString());
          
          if (fallbackError) {
            return NextResponse.json(
              { success: false, error: 'Failed to fetch reservations' },
              { status: 500 }
            );
          }
          
          // Map fallback reservations to include default duration
          pendingBookings = (fallbackReservations || []).map(reservation => ({
            ...reservation,
            duration_minutes: 60 // Default to 60 minutes
          }));
        } else {
          return NextResponse.json(
            { success: false, error: 'Failed to fetch reservations' },
            { status: 500 }
          );
        }
      } else {
        pendingBookings = pendingData || [];
      }
    } catch (error) {
      console.error('Error in pending bookings fetch:', error);
      pendingBookings = [];
    }

    // Fetch busy slots from calendar_events table
    let busySlots = [];
    try {
      // Use same timezone logic as admin calendar API
      // Expand search range to account for timezone differences
      const dayBefore = new Date(date);
      dayBefore.setDate(dayBefore.getDate() - 1);
      const dayAfter = new Date(date);
      dayAfter.setDate(dayAfter.getDate() + 1);
      
      const searchStartUTC = dayBefore.toISOString().split('T')[0] + 'T00:00:00.000Z';
      const searchEndUTC = dayAfter.toISOString().split('T')[0] + 'T23:59:59.999Z';
      
      const { data: allBusyData, error: busyError } = await supabase
        .from('calendar_events')
        .select('start_time, end_time')
        .gte('start_time', searchStartUTC)
        .lte('start_time', searchEndUTC);

      if (busyError) {
        console.error('Error fetching busy slots:', busyError);
        busySlots = [];
      } else {
        // Filter events to only include those that occur on the requested local date
        const filteredBusyData = allBusyData?.filter(slot => {
          const startTimeLocal = new Date(slot.start_time);
          const localDateString = startTimeLocal.toLocaleDateString('en-CA'); // YYYY-MM-DD format
          return localDateString === date;
        }) || [];
        
        console.log(`Found ${filteredBusyData?.length || 0} busy slots for date ${date}`);
        
        // Convert busy slots to the same format as bookings
        busySlots = filteredBusyData.map(slot => {
          const startTime = new Date(slot.start_time);
          const endTime = new Date(slot.end_time);
          
          // Convert UTC times to user's timezone for display
          const localStartTime = convertUTCToLocal(slot.start_time, timezone);
          const localEndTime = convertUTCToLocal(slot.end_time, timezone);
          
          const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
          const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
          const duration = endMinutes - startMinutes;
          
          return {
            booking_time: localStartTime.time,
            duration_minutes: duration
          };
        });
      }
    } catch (error) {
      console.error('Error in busy slots fetch:', error);
      busySlots = [];
    }

    // Check for conflicts with existing bookings AND busy slots
    const availableSlots = allSlots.filter(slot => {
      return !hasTimeConflict(slot, [...confirmedBookings, ...pendingBookings, ...busySlots], duration);
    });

    return NextResponse.json({
      success: true,
      availableSlots,
      date,
      duration
    });

  } catch (error) {
    console.error('Availability API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate time slots based on duration and business hours
function generateTimeSlots(durationMinutes, startTime = '09:00:00', endTime = '17:00:00') {
  const slots = [];
  
  // Parse start and end times
  const [startHour, startMinute] = startTime.split(':').map(num => parseInt(num));
  const [endHour, endMinute] = endTime.split(':').map(num => parseInt(num));
  
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  
  const intervalMinutes = durationMinutes; // Use duration as interval
  
  for (let currentMinutes = startTotalMinutes; currentMinutes < endTotalMinutes; currentMinutes += intervalMinutes) {
    const hour = Math.floor(currentMinutes / 60);
    const minute = currentMinutes % 60;
    
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    // Check if this slot would end before business hours end
    const slotEnd = currentMinutes + durationMinutes;
    
    if (slotEnd <= endTotalMinutes) {
      slots.push({ 
        time: timeString, 
        available: true,
        duration: durationMinutes,
        endTime: `${Math.floor(slotEnd / 60).toString().padStart(2, '0')}:${(slotEnd % 60).toString().padStart(2, '0')}`
      });
    }
  }
  
  return slots;
}

// Check if a proposed slot conflicts with existing bookings
function hasTimeConflict(proposedSlot, existingBookings, proposedDuration) {
  const proposedStart = timeToMinutes(proposedSlot.time);
  const proposedEnd = proposedStart + proposedDuration;
  
  for (const booking of existingBookings) {
    const bookingStart = timeToMinutes(booking.booking_time);
    const bookingDuration = booking.duration_minutes || 60; // Default to 60 if not specified
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

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { convertUTCToLocal, convertLocalToUTC } from '@/lib/timezone-utils';

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    console.log(`=== Calendar API called for date: ${date} ===`);

    if (!date) {
      return NextResponse.json({ 
        success: false, 
        error: 'Date parameter is required' 
      }, { status: 400 });
    }

        // Get bookings for the specified date from bookings table
    console.log(`Fetching bookings for exact date: ${date}`);
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('booking_date', date)
      .order('booking_time', { ascending: true });
      
    console.log(`Bookings query result: ${bookings?.length || 0} found`);
    if (bookings?.length) {
      console.log('Sample booking dates:', bookings.slice(0, 3).map(b => ({ id: b.id, date: b.booking_date, email: b.customer_email })));
    }

    // Get busy slots (blocked events) from calendar_events table
    // Filter by date range since calendar_events uses ISO timestamps, not date field
    // Account for timezone differences - we need to check for events that might
    // start or end on the requested date in local time, even if stored in UTC
    
    // Expand the search range to account for timezone differences (±24 hours)
    const dayBefore = new Date(date);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const dayAfter = new Date(date);
    dayAfter.setDate(dayAfter.getDate() + 1);
    
    const searchStartUTC = dayBefore.toISOString().split('T')[0] + 'T00:00:00.000Z';
    const searchEndUTC = dayAfter.toISOString().split('T')[0] + 'T23:59:59.999Z';
    
    console.log(`Searching calendar events between ${searchStartUTC} and ${searchEndUTC}`);
    console.log(`Looking for events for local date: ${date}`);
    
    const { data: allBusySlots, error: busySlotsError } = await supabaseAdmin
      .from('calendar_events')
      .select('*')
      .gte('start_time', searchStartUTC)
      .lte('start_time', searchEndUTC)
      .order('start_time', { ascending: true });

    // Filter events to only include those that occur on the requested local date
    const busySlots = allBusySlots?.filter(slot => {
      const startTimeLocal = new Date(slot.start_time);
      const localDateString = startTimeLocal.toLocaleDateString('en-CA'); // YYYY-MM-DD format
      const matches = localDateString === date;
      if (!matches && allBusySlots.length > 0) {
        console.log(`Filtered out busy slot: UTC ${slot.start_time} -> local ${localDateString}, requested ${date}`);
      }
      return matches;
    }) || [];

    // Return data even if there are errors (graceful fallback)
    console.log(`=== Final results for ${date} ===`);
    console.log(`Bookings: ${bookings?.length || 0}, BusySlots: ${busySlots?.length || 0}`);
    
    if (busySlots?.length > 0) {
      console.log('Busy slots found:', busySlots.map(slot => ({
        id: slot.id,
        title: slot.title,
        start_time: slot.start_time,
        localStart: new Date(slot.start_time).toLocaleString()
      })));
    }
    
    // Filter bookings client-side as a safety check and log discrepancies
    const filteredBookings = bookings?.filter(booking => {
      const matches = booking.booking_date === date;
      if (!matches) {
        console.log(`⚠️  Filtered out booking: date=${booking.booking_date}, requested=${date}, email=${booking.customer_email}`);
      }
      return matches;
    }) || [];
    
    if (bookings?.length !== filteredBookings.length) {
      console.log(`🚨 DATE MISMATCH: Found ${bookings.length} bookings but only ${filteredBookings.length} match the requested date ${date}`);
    }
    console.log(`After client-side filtering: ${filteredBookings.length} bookings`);
    
    return NextResponse.json({ 
      success: true, 
      bookings: filteredBookings,
      busySlots: busySlots || [],
      slots: [], // Legacy field for compatibility
      debug: {
        requestedDate: date,
        bookingsFound: bookings?.length || 0,
        bookingsAfterFilter: filteredBookings.length,
        busySlotsFound: busySlots?.length || 0
      }
    });

  } catch (error) {
    console.error('Error fetching calendar slots:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, date, startTime, endTime, reason, awayStatus } = body;

    if (action === 'mark_busy') {
      // Insert a new blocked event in calendar_events table
      // Convert date and time to ISO timestamp format using local timezone
      console.log('Creating busy slot with:', { date, startTime, endTime, reason, awayStatus });
      
      // Create local datetime strings and convert to UTC for storage
      const startDateTimeLocal = `${date}T${startTime}:00`;
      const endDateTimeLocal = `${date}T${endTime}:00`;
      
      const startDateTime = new Date(startDateTimeLocal);
      const endDateTime = new Date(endDateTimeLocal);
      
      console.log('Local datetime strings:', { 
        startLocal: startDateTimeLocal, 
        endLocal: endDateTimeLocal 
      });
      console.log('Converted to UTC:', { 
        startDateTime: startDateTime.toISOString(), 
        endDateTime: endDateTime.toISOString() 
      });      const { data, error } = await supabaseAdmin
        .from('calendar_events')
        .insert({
          title: awayStatus ? 'Away - Not Available' : (reason || 'Busy - Admin Block'),
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          description: awayStatus ? 'Admin is away/unavailable' : (reason || 'Time blocked by admin'),
          away_status: awayStatus || false,
          created_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error('Error creating busy slot:', error);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to create busy slot' 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        data: data[0]
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action' 
    }, { status: 400 });

  } catch (error) {
    console.error('Error in calendar slots API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

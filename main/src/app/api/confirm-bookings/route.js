import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    console.log('Starting booking confirmation process...');

    // Get all confirmed reservations that haven't been moved to bookings yet
    const { data: confirmedReservations, error: reservationError } = await supabaseAdmin
      .from('booking_reservations')
      .select(`
        *,
        transactions!inner(*)
      `)
      .eq('status', 'confirmed')
      .not('transaction_id', 'is', null);

    if (reservationError) {
      console.error('Error fetching confirmed reservations:', reservationError);
      return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
    }

    console.log(`Found ${confirmedReservations.length} confirmed reservations to process`);

    let movedCount = 0;
    let errors = [];

    for (const reservation of confirmedReservations) {
      try {
        // Check if booking already exists for this reservation
        const { data: existingBooking } = await supabaseAdmin
          .from('bookings')
          .select('id')
          .eq('transaction_id', reservation.transaction_id)
          .single();

        if (existingBooking) {
          console.log(`Booking already exists for reservation ${reservation.id}`);
          continue;
        }

        // Get transaction details to find user_id
        const transaction = reservation.transactions;
        
        // Create confirmed booking record
        const bookingData = {
          product_id: reservation.product_id,
          user_id: transaction?.user_id || null,
          customer_email: transaction?.customer_email || 'unknown@example.com',
          booking_date: reservation.booking_date,
          booking_time: reservation.booking_time,
          duration_minutes: reservation.duration_minutes,
          status: 'confirmed',
          transaction_id: reservation.transaction_id,
          stripe_session_id: transaction?.stripe_session_id || null,
          notes: `Moved from reservation ${reservation.reservation_id}`,
          created_at: reservation.confirmed_at || reservation.created_at
        };

        const { data: newBooking, error: bookingError } = await supabaseAdmin
          .from('bookings')
          .insert(bookingData)
          .select()
          .single();

        if (bookingError) {
          console.error(`Error creating booking for reservation ${reservation.id}:`, bookingError);
          errors.push({
            reservationId: reservation.id,
            error: bookingError.message
          });
          continue;
        }

        console.log(`Successfully created booking ${newBooking.id} from reservation ${reservation.id}`);
        movedCount++;

        // Optionally update reservation status to 'moved' or delete it
        // For now, let's just mark it as processed
        await supabaseAdmin
          .from('booking_reservations')
          .update({ notes: `Moved to booking ${newBooking.id}` })
          .eq('id', reservation.id);

      } catch (error) {
        console.error(`Error processing reservation ${reservation.id}:`, error);
        errors.push({
          reservationId: reservation.id,
          error: error.message
        });
      }
    }

    console.log(`Booking confirmation complete: ${movedCount} moved, ${errors.length} errors`);

    return NextResponse.json({
      success: true,
      movedCount,
      totalProcessed: confirmedReservations.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error in confirm-bookings API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// GET endpoint to check status
export async function GET() {
  try {
    const [reservationsResult, bookingsResult] = await Promise.all([
      supabaseAdmin.from('booking_reservations').select('status').eq('status', 'confirmed'),
      supabaseAdmin.from('bookings').select('id')
    ]);

    return NextResponse.json({
      confirmedReservations: reservationsResult.data?.length || 0,
      totalBookings: bookingsResult.data?.length || 0,
      pendingToMove: reservationsResult.data?.length || 0
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { sessionId, userId, userEmail } = await request.json();
    
    console.log('Payment callback triggered:', { sessionId, userId, userEmail });

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Find the transaction by stripe session ID, or create it if it doesn't exist
    let transaction;
    const { data: existingTransaction, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single();

    if (transactionError && transactionError.code === 'PGRST116') {
      // Transaction doesn't exist, create it now with Stripe session data
      console.log('Transaction not found, creating from Stripe session');
      
      try {
        // Get Stripe session details to create transaction
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        const transactionData = {
          customer_email: userEmail || session.customer_details?.email || 'unknown@temp.com',
          product_id: session.metadata?.productId,
          amount: session.amount_total,
          status: session.payment_status === 'paid' ? 'completed' : 'pending',
          stripe_session_id: sessionId,
          user_id: userId || null,
          booking_timestamp: session.metadata?.selectedTimeSlot ? new Date(session.metadata.selectedTimeSlot) : null
        };

        const { data: newTransaction, error: createError } = await supabaseAdmin
          .from('transactions')
          .insert(transactionData)
          .select()
          .single();

        if (createError) {
          console.error('Error creating transaction:', createError);
          return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
        }

        transaction = newTransaction;
        console.log('Created new transaction:', transaction);

      } catch (stripeError) {
        console.error('Error fetching Stripe session:', stripeError);
        return NextResponse.json({ error: 'Failed to retrieve session details' }, { status: 500 });
      }
    } else if (transactionError) {
      console.error('Error finding transaction:', transactionError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    } else {
      transaction = existingTransaction;
      console.log('Found existing transaction:', transaction);
    }

    console.log('Found transaction:', transaction);

    // First, look for pending reservations that match this transaction's product and timeframe
    const { data: pendingReservations, error: reservationError } = await supabaseAdmin
      .from('booking_reservations')
      .select('*')
      .eq('status', 'pending')
      .eq('product_id', transaction.product_id)
      .gte('expires_at', new Date().toISOString()) // Not expired yet
      .order('created_at', { ascending: false })
      .limit(5); // Get recent reservations

    if (reservationError) {
      console.error('Error finding reservations:', reservationError);
      return NextResponse.json({ error: 'Could not find reservations' }, { status: 500 });
    }

    console.log(`Found ${pendingReservations.length} pending reservations for product ${transaction.product_id}`);

    if (pendingReservations.length === 0) {
      // Update transaction status even if no reservations (for PDF purchases)
      if (transaction.status !== 'completed') {
        const { error: updateError } = await supabaseAdmin
          .from('transactions')
          .update({ 
            status: 'completed',
            user_id: userId || transaction.user_id,
            customer_email: userEmail || transaction.customer_email
          })
          .eq('id', transaction.id);

        if (updateError) {
          console.error('Error updating transaction:', updateError);
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Payment confirmed but no pending reservations found',
        transaction: transaction.id
      });
    }

    // Take the most recent reservation (assume it's the one for this payment)
    const reservation = pendingReservations[0];
    
    console.log('Processing reservation:', reservation);

    // Update transaction status and add booking token for secure linking
    if (transaction.status !== 'completed') {
      const { error: updateError } = await supabaseAdmin
        .from('transactions')
        .update({ 
          status: 'completed',
          booking_token: reservation.booking_token, // Add booking token for secure account linking
          user_id: userId || transaction.user_id,
          customer_email: userEmail || transaction.customer_email
        })
        .eq('id', transaction.id);

      if (updateError) {
        console.error('Error updating transaction:', updateError);
      } else {
        console.log('Transaction status updated to completed with booking token');
      }
    }

    // 1. Update reservation to confirmed
    const { error: confirmError } = await supabaseAdmin
      .from('booking_reservations')
      .update({
        status: 'confirmed',
        transaction_id: transaction.id,
        confirmed_at: new Date().toISOString()
      })
      .eq('id', reservation.id);

    if (confirmError) {
      console.error('Error confirming reservation:', confirmError);
      return NextResponse.json({ error: 'Failed to confirm reservation' }, { status: 500 });
    }

    console.log('Reservation confirmed, now creating booking...');

    // 2. Create confirmed booking record with booking token for secure linking
    const bookingData = {
      product_id: transaction.product_id,
      user_id: userId || transaction.user_id,
      customer_email: userEmail || transaction.customer_email,
      booking_date: reservation.booking_date,
      booking_time: reservation.booking_time,
      duration_minutes: reservation.duration_minutes,
      booking_token: reservation.booking_token, // Include booking token for secure account linking
      status: 'confirmed',
      transaction_id: transaction.id,
      stripe_session_id: sessionId,
      notes: `Confirmed via payment callback from reservation ${reservation.reservation_id}`,
      created_at: new Date().toISOString()
    };

    console.log('Creating booking with data:', bookingData);

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    console.log('Booking created successfully:', booking);

    // 3. Create calendar event if it's a coaching session
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', transaction.product_id)
      .single();

    if (product && (product.type === 'coaching_individual' || product.type === 'coaching_team')) {
      const startTime = new Date(`${reservation.booking_date}T${reservation.booking_time}`);
      const endTime = new Date(startTime.getTime() + (reservation.duration_minutes * 60 * 1000));

      const { error: calendarError } = await supabaseAdmin
        .from('calendar_events')
        .insert({
          title: `${product.name} - ${bookingData.customer_email}`,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          transaction_id: transaction.id,
          customer_email: bookingData.customer_email,
          notes: `Booking confirmed via payment callback`
        });

      if (calendarError) {
        console.error('Error creating calendar event:', calendarError);
      } else {
        console.log('Calendar event created');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment and booking confirmed successfully',
      booking: booking,
      reservation: reservation,
      transaction: transaction.id,
      bookingToken: reservation.booking_token // Include booking token for secure account linking
    });

  } catch (error) {
    console.error('Error in payment callback:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// GET endpoint to manually trigger confirmation for testing
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  
  if (!sessionId) {
    return NextResponse.json({ error: 'session_id parameter required' }, { status: 400 });
  }

  // Call the POST method with the session ID
  const mockRequest = {
    json: () => Promise.resolve({ sessionId })
  };

  return POST(mockRequest);
}

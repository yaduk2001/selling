// API route to link a newly created account with an existing purchase
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Secure token-based account linking function
async function linkWithBookingToken(bookingToken, userId, email) {
  try {
    console.log(`Linking account with booking token: ${bookingToken}`);
    
    // Find and update transactions with matching booking token and email
    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('booking_token', bookingToken)
      .eq('customer_email', email); // Security: must match email

    if (transactionError) {
      console.error('Error finding transactions:', transactionError);
      return NextResponse.json(
        { success: false, error: 'Database error finding transactions' },
        { status: 500 }
      );
    }

    // Find and update booking reservations with matching token
    const { data: reservations, error: reservationError } = await supabase
      .from('booking_reservations')
      .select('*')
      .eq('booking_token', bookingToken);

    if (reservationError) {
      console.error('Error finding reservations:', reservationError);
      return NextResponse.json(
        { success: false, error: 'Database error finding reservations' },
        { status: 500 }
      );
    }

    // Find and update bookings with matching token and email
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_token', bookingToken)
      .eq('customer_email', email); // Security: must match email

    if (bookingError) {
      console.error('Error finding bookings:', bookingError);
      return NextResponse.json(
        { success: false, error: 'Database error finding bookings' },
        { status: 500 }
      );
    }

    // Security check: ensure at least one record exists with this token
    if ((!transactions || transactions.length === 0) && 
        (!reservations || reservations.length === 0) && 
        (!bookings || bookings.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Invalid booking token or email mismatch' },
        { status: 400 }
      );
    }

    let updatedTransactions = 0;
    let updatedBookings = 0;

    // Update transactions
    if (transactions && transactions.length > 0) {
      const { error: updateTransactionError } = await supabase
        .from('transactions')
        .update({ 
          user_id: userId,
          updated_at: new Date().toISOString()
        })
        .eq('booking_token', bookingToken)
        .eq('customer_email', email); // Double security check

      if (updateTransactionError) {
        console.error('Error updating transactions:', updateTransactionError);
        return NextResponse.json(
          { success: false, error: 'Failed to link transactions' },
          { status: 500 }
        );
      }
      updatedTransactions = transactions.length;
    }

    // Update bookings
    if (bookings && bookings.length > 0) {
      const { error: updateBookingError } = await supabase
        .from('bookings')
        .update({
          user_id: userId,
          updated_at: new Date().toISOString()
        })
        .eq('booking_token', bookingToken)
        .eq('customer_email', email); // Double security check

      if (updateBookingError) {
        console.error('Error updating bookings:', updateBookingError);
        return NextResponse.json(
          { success: false, error: 'Failed to link bookings' },
          { status: 500 }
        );
      }
      updatedBookings = bookings.length;
    }

    // Update booking reservations (these don't have customer_email, so we rely on token only)
    if (reservations && reservations.length > 0) {
      const { error: updateReservationError } = await supabase
        .from('booking_reservations')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('booking_token', bookingToken);

      if (updateReservationError) {
        console.error('Error updating reservations:', updateReservationError);
        // Don't fail the request, just log the error
      }
    }

    console.log(`Successfully linked account: ${updatedTransactions} transactions, ${updatedBookings} bookings`);

    return NextResponse.json({
      success: true,
      message: 'Account successfully linked to booking via secure token',
      transactionsUpdated: updatedTransactions,
      bookingsUpdated: updatedBookings,
      method: 'token-based'
    });

  } catch (error) {
    console.error('Token-based linking error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during token linking' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { sessionId, userId, email, bookingToken } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: userId and email' },
        { status: 400 }
      );
    }

    // If bookingToken is provided, use secure token-based linking
    if (bookingToken) {
      return await linkWithBookingToken(bookingToken, userId, email);
    }

    // Fallback to session-based linking if no booking token
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing sessionId or bookingToken' },
        { status: 400 }
      );
    }

    // Verify the Stripe session
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (stripeError) {
      console.error('Error retrieving Stripe session:', stripeError);
      return NextResponse.json(
        { success: false, error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    // Verify the email matches
    if (session.customer_details?.email !== email) {
      return NextResponse.json(
        { success: false, error: 'Email mismatch' },
        { status: 400 }
      );
    }

    // Find existing transaction records
    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('stripe_session_id', sessionId);

    if (transactionError) {
      console.error('Error finding transactions:', transactionError);
      return NextResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      );
    }

    if (transactions && transactions.length > 0) {
      // Update existing transactions with user ID
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ 
          user_id: userId,
          customer_email: email,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_session_id', sessionId);

      if (updateError) {
        console.error('Error updating transactions:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to link transactions' },
          { status: 500 }
        );
      }

      // Update any related bookings
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          user_id: userId,
          customer_email: email,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_session_id', sessionId);

      if (bookingError) {
        console.error('Error updating bookings:', bookingError);
        // Don't fail the request, just log the error
      }

      return NextResponse.json({
        success: true,
        message: 'Account successfully linked to purchase',
        transactionsUpdated: transactions.length
      });
    }

    // If no existing transactions found, create a new one
    const transactionData = {
      user_id: userId,
      amount: session.amount_total,
      currency: session.currency,
      status: session.payment_status === 'paid' ? 'completed' : 'pending',
      stripe_session_id: sessionId,
      customer_email: email,
      created_at: new Date().toISOString()
    };

    const { data: newTransaction, error: insertError } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating transaction:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create transaction record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Account linked and transaction created',
      transaction: newTransaction
    });

  } catch (error) {
    console.error('Link account purchase error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

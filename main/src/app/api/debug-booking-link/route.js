// DEBUG: Test booking-user linking flow
// This endpoint helps debug the complete flow
// DELETE THIS FILE after debugging

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const bookingToken = searchParams.get('booking_token');

    const debug = {
      sessionId,
      bookingToken,
      transactions: [],
      reservations: [],
      bookings: [],
      users: []
    };

    // 1. Find transaction by session ID
    if (sessionId) {
      const { data: transactions } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('stripe_session_id', sessionId);
      debug.transactions = transactions || [];
    }

    // 2. Find reservations by booking token
    if (bookingToken) {
      const { data: reservations } = await supabaseAdmin
        .from('booking_reservations')
        .select('*')
        .eq('booking_token', bookingToken);
      debug.reservations = reservations || [];
    }

    // 3. Find bookings by booking token
    if (bookingToken) {
      const { data: bookings } = await supabaseAdmin
        .from('bookings')
        .select('*')
        .eq('booking_token', bookingToken);
      debug.bookings = bookings || [];
    }

    // 4. Find recent users
    const { data: users } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);
    debug.users = users || [];

    return NextResponse.json({
      success: true,
      debug,
      analysis: {
        hasTransaction: debug.transactions.length > 0,
        hasReservation: debug.reservations.length > 0,
        hasBooking: debug.bookings.length > 0,
        transactionLinked: debug.transactions.some(t => t.user_id !== null),
        bookingLinked: debug.bookings.some(b => b.user_id !== null)
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}

export async function POST(request) {
  try {
    const { action, sessionId, userId, email, bookingToken } = await request.json();

    if (action === 'test_link') {
      // Test the linking process
      const linkResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/link-account-purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          bookingToken,
          userId,
          email
        })
      });

      const linkResult = await linkResponse.json();
      
      return NextResponse.json({
        success: true,
        linkResult
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Unknown action'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}

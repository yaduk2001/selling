import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // Get transaction from Supabase
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .select(`
        *,
        products (
          id,
          name,
          type,
          description,
          features
        )
      `)
      .eq('stripe_session_id', sessionId)
      .single();

    if (transactionError) {
      console.error('Error fetching transaction:', transactionError);
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const product = transaction.products;
    
    return NextResponse.json({
      id: session.id,
      transaction: {
        id: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        booking_timestamp: transaction.booking_timestamp,
        customer_email: transaction.customer_email
      },
      product: {
        id: product.id,
        name: product.name,
        type: product.type,
        description: product.description,
        features: product.features
      },
      customerEmail: session.customer_details?.email || transaction.customer_email,
      customerName: session.customer_details?.name,
      amountPaid: session.amount_total / 100,
      paymentStatus: session.payment_status,
      bookingDetails: transaction.booking_timestamp ? {
        selectedTimeSlot: transaction.booking_timestamp,
        isCoachingSession: product.type === 'coaching_individual' || product.type === 'coaching_team'
      } : null
    });

  } catch (error) {
    console.error('Error verifying Stripe session:', error);
    return NextResponse.json({ error: 'Failed to verify session' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.text();
    const headersList = headers();
    const sig = headersList.get('stripe-signature');

    if (!sig) {
      console.error('Missing stripe-signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    if (!endpointSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Processing webhook event:', event.type);

    // Handle the checkout session completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await handleCheckoutSessionCompleted(session);
    }

    // Handle payment intent succeeded (additional confirmation)
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      await handlePaymentSuccess(paymentIntent);
    }

    // Handle payment failures
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      await handlePaymentFailed(paymentIntent);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session) {
  try {
    console.log('Processing completed checkout session:', session.id);

    // Update transaction status
    const { data: transaction, error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({
        status: 'completed'
      })
      .eq('stripe_session_id', session.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating transaction:', updateError);
      return;
    }

    if (!transaction) {
      console.error('Transaction not found for session:', session.id);
      return;
    }

    // Get product details
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', transaction.product_id)
      .single();

    // If it's a coaching session, create calendar event
    if (product && (product.type === 'coaching_individual' || product.type === 'coaching_team') && transaction.booking_timestamp) {
      await createCalendarEvent(transaction, product);
    }

    // Send confirmation email (you can implement this later)
    await sendConfirmationEmail(transaction, product);

    console.log('Successfully processed checkout session:', session.id);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function createCalendarEvent(transaction, product) {
  try {
    const startTime = new Date(transaction.booking_timestamp);
    const endTime = new Date(startTime.getTime() + (60 * 60 * 1000)); // 1 hour session

    const { error: calendarError } = await supabaseAdmin
      .from('calendar_events')
      .insert({
        title: `${product.name} - ${transaction.customer_email}`,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        transaction_id: transaction.id,
        customer_email: transaction.customer_email,
        notes: `Coaching session purchased via Stripe. Session ID: ${transaction.stripe_session_id}`
      });

    if (calendarError) {
      console.error('Error creating calendar event:', calendarError);
    } else {
      console.log('Calendar event created for transaction:', transaction.id);
    }
  } catch (error) {
    console.error('Error in createCalendarEvent:', error);
  }
}

async function handlePaymentSuccess(paymentIntent) {
  try {
    console.log('Payment succeeded:', paymentIntent.id);
    // Additional handling if needed
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(paymentIntent) {
  try {
    console.log('Payment failed:', paymentIntent.id);
    
    // Find the transaction by looking for related checkout session
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: paymentIntent.id,
      limit: 1
    });

    if (sessions.data.length > 0) {
      const sessionId = sessions.data[0].id;
      
      const { error: updateError } = await supabaseAdmin
        .from('transactions')
        .update({ status: 'failed' })
        .eq('stripe_session_id', sessionId);

      if (updateError) {
        console.error('Error updating failed transaction:', updateError);
      }
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function sendConfirmationEmail(transaction, product) {
  try {
    // TODO: Implement email sending using Resend or your preferred service
    console.log(`Should send confirmation email to ${transaction.customer_email} for ${product?.name}`);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
}

// Ensure webhook endpoint accepts POST requests only
export const runtime = 'nodejs';

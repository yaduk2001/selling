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
    console.log('Session metadata:', session.metadata);
    console.log('Customer details:', session.customer_details);

    // Extract metadata from session
    const metadata = session.metadata;
    const reservationId = metadata?.reservationId;
    const bookingDate = metadata?.bookingDate;
    const bookingTime = metadata?.bookingTime;
    const duration = parseInt(metadata?.duration) || 60;

    // Prepare update data
    const updateData = {
      status: 'completed'
    };

    // If customer email is available and transaction doesn't have it, update it
    if (session.customer_details?.email) {
      updateData.customer_email = session.customer_details.email;
    }

    console.log('Updating transaction with:', updateData);

    // Update transaction status and email
    const { data: transaction, error: updateError } = await supabaseAdmin
      .from('transactions')
      .update(updateData)
      .eq('stripe_session_id', session.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating transaction:', updateError);
      console.error('Update data:', updateData);
      console.error('Session ID:', session.id);
      return;
    }

    if (!transaction) {
      console.error('Transaction not found for session:', session.id);
      // Try to find transaction by payment_intent if available
      if (session.payment_intent) {
        console.log('Attempting to find transaction by payment_intent:', session.payment_intent);
      }
      return;
    }

    console.log('Transaction updated successfully:', transaction);

    // Handle booking confirmation if this was a coaching session with reservation
    if (reservationId && bookingDate && bookingTime) {
      console.log('Processing booking reservation:', { reservationId, bookingDate, bookingTime, duration });
      await confirmBookingReservation(reservationId, bookingDate, bookingTime, duration, transaction, session);
    } else {
      console.log('No booking reservation data found in metadata');
    }

    // Get product details
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', transaction.product_id)
      .single();

    if (productError) {
      console.error('Error fetching product:', productError);
    } else {
      console.log('Product details:', product);
    }

    // If it's a coaching session, create calendar event
    if (product && (product.type === 'coaching_individual' || product.type === 'coaching_team') && transaction.booking_timestamp) {
      await createCalendarEvent(transaction, product);
    }

    // Send confirmation email
    await sendConfirmationEmail(transaction, product, session);

    console.log('Successfully processed checkout session:', session.id);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    console.error('Error stack:', error.stack);
    console.error('Session data:', JSON.stringify(session, null, 2));
  }
}

async function confirmBookingReservation(reservationId, bookingDate, bookingTime, duration, transaction, session) {
  try {
    console.log('Confirming booking reservation:', reservationId);

    // First, check if booking tables exist
    const { data: tablesExist } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['booking_reservations', 'bookings']);

    if (!tablesExist || tablesExist.length < 2) {
      console.error('Booking tables do not exist. Please run the database schema fix.');
      return;
    }

    // Update the reservation status to confirmed and link to transaction
    const { error: reservationError } = await supabaseAdmin
      .from('booking_reservations')
      .update({
        status: 'confirmed',
        transaction_id: transaction.id,
        confirmed_at: new Date().toISOString()
      })
      .eq('reservation_id', reservationId);

    if (reservationError) {
      console.error('Error updating reservation:', reservationError);
      return;
    }

    // Create confirmed booking record with better data handling
    const bookingData = {
      product_id: transaction.product_id,
      customer_email: session.customer_details?.email || transaction.customer_email,
      booking_date: bookingDate,
      booking_time: bookingTime,
      duration_minutes: duration,
      status: 'confirmed',
      transaction_id: transaction.id,
      stripe_session_id: session.id,
      user_id: transaction.user_id || null, // Critical: Link to user ID from transaction
      created_at: new Date().toISOString()
    };

    console.log('Creating booking with data:', bookingData);

    const { error: bookingError, data: createdBooking } = await supabaseAdmin
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating confirmed booking:', bookingError);
      console.error('Booking data attempted:', bookingData);
      
      // Additional debugging - check if user exists
      if (transaction.user_id) {
        const { data: userCheck } = await supabaseAdmin
          .from('profiles')
          .select('id, email')
          .eq('id', transaction.user_id)
          .single();
        
        console.log('User profile check:', userCheck);
      }
    } else {
      console.log(`✅ Booking confirmed for: ${bookingDate} at ${bookingTime} (${duration} minutes)`);
      console.log('Created booking:', createdBooking);
      
      // Verify booking was created properly
      const { data: verifyBooking } = await supabaseAdmin
        .from('bookings')
        .select('*, products(*)')
        .eq('id', createdBooking.id)
        .single();
        
      console.log('Booking verification:', verifyBooking);
    }

  } catch (error) {
    console.error('Error in confirmBookingReservation:', error);
    console.error('Stack trace:', error.stack);
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

async function sendConfirmationEmail(transaction, product, session) {
  try {
    // Get customer email from session (most reliable) or transaction
    const customerEmail = session?.customer_details?.email || transaction.customer_email;
    const customerName = session?.customer_details?.name || transaction.customer_name || 'Customer';
    
    console.log(`Sending confirmation email to ${customerEmail} for ${product?.name}`);
    console.log('Session customer details:', session?.customer_details);
    console.log('Transaction customer email:', transaction.customer_email);
    
    // Check if we have a valid customer email
    if (!customerEmail) {
      console.error('No customer email found - cannot send confirmation email');
      return;
    }
    
    // Check if email service is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('No email service configured - skipping email notification');
      return;
    }

    // Import nodemailer
    const nodemailer = await import('nodemailer');

    // Create Nodemailer transporter with Gmail SMTP
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify connection
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error('SMTP connection verification failed:', verifyError);
      return;
    }

    // Prepare email content
    const sessionDate = transaction.booking_date ? new Date(transaction.booking_date).toLocaleDateString() : 'Not specified';
    const sessionTime = transaction.booking_time || 'Not specified';
    const productName = product?.name || 'Service';
    const amountPaid = product?.price ? (product.price / 100).toFixed(2) : '0.00';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✅ Booking Confirmed!</h1>
          <p style="color: #fed7aa; margin: 10px 0 0 0; font-size: 16px;">Your session has been successfully booked</p>
        </div>
        
        <div style="padding: 40px 20px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
            Hi ${customerName},
          </p>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Great news! Your booking has been confirmed. Here are your session details:
          </p>
          
          <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 30px; margin: 30px 0;">
            <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">📅 Session Details</h3>
            <div style="display: grid; gap: 15px;">
              <div><strong>Date:</strong> ${sessionDate}</div>
              <div><strong>Time:</strong> ${sessionTime}</div>
              <div><strong>Service:</strong> ${productName}</div>
              <div><strong>Amount Paid:</strong> $${amountPaid}</div>
              <div><strong>Booking ID:</strong> ${transaction.id}</div>
            </div>
          </div>
          
          <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
            <h4 style="color: #065f46; margin: 0 0 10px 0;">💡 What's Next?</h4>
            <ul style="color: #047857; margin: 0; padding-left: 20px;">
              <li>You'll receive a reminder email 24 hours before your session</li>
              <li>Check your email for any additional instructions</li>
              <li>Contact us if you need to reschedule</li>
            </ul>
          </div>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Thank you for choosing our services! We look forward to working with you.
          </p>
        </div>
        
        <div style="background: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Best regards,<br>
            <strong>Selling Infinity Team</strong>
          </p>
        </div>
      </div>
    `;

    // Send email using Nodemailer
    const info = await transporter.sendMail({
      from: `"Selling Infinity" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `✅ Booking Confirmed - ${productName}`,
      html: htmlContent,
    });

    console.log('Confirmation email sent successfully:', info.messageId);

  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
}

// Ensure webhook endpoint accepts POST requests only
export const runtime = 'nodejs';

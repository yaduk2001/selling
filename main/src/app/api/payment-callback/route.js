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

    // 3. Get product details for email and calendar event
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', transaction.product_id)
      .single();

    // 4. Send booking confirmation email
    try {
      console.log('📧 Sending booking confirmation email...');
      const emailResult = await sendConfirmationEmail(transaction, product, booking);
      if (emailResult && emailResult.success) {
        console.log('✅ Booking confirmation email sent successfully');
        console.log('   Message ID:', emailResult.messageId);
        console.log('   Customer Email:', emailResult.customerEmail);
        console.log('   Email Source:', emailResult.emailSource);
      } else {
        console.error('❌ Failed to send booking confirmation email');
        if (emailResult) {
          console.error('   Error:', emailResult.error);
          console.error('   Error Type:', emailResult.errorType);
          console.error('   Transaction ID:', emailResult.transactionId);
        }
      }
    } catch (emailError) {
      console.error('❌ Error sending confirmation email:', emailError);
    }

    // 5. Create calendar event if it's a coaching session

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

async function sendConfirmationEmail(transaction, product, booking) {
  try {
    console.log('=== BOOKING CONFIRMATION EMAIL PROCESSING ===');
    console.log('Transaction ID:', transaction.id);
    console.log('Product:', product?.name);
    console.log('User ID:', transaction.user_id);
    
    // SECURITY: Validate required parameters
    if (!transaction || !transaction.id) {
      console.error('Invalid transaction data provided');
      return { success: false, error: 'Invalid transaction data' };
    }
    
    if (!product || !product.name) {
      console.error('Invalid product data provided');
      return { success: false, error: 'Invalid product data' };
    }
    
    // Get customer email from logged-in user's profile (SECURE & RELIABLE)
    let customerEmail = null;
    let customerName = 'Customer';
    let emailSource = 'unknown';
    
    // PRIORITY 1: Get email from logged-in user's profile (MOST SECURE)
    if (transaction.user_id) {
      console.log('🔍 Extracting email from logged-in user profile...');
      console.log('User ID:', transaction.user_id);
      
      try {
        const { data: userProfile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('email, full_name')
          .eq('id', transaction.user_id)
          .single();
        
        if (!profileError && userProfile && userProfile.email) {
          customerEmail = userProfile.email.trim();
          customerName = userProfile.full_name?.trim() || 'Customer';
          emailSource = 'user_profile';
          console.log('✅ Successfully extracted email from user profile');
          console.log('Email:', customerEmail);
          console.log('Name:', customerName);
        } else {
          console.log('❌ Profile error or no email found:', profileError?.message || 'No email in profile');
        }
      } catch (profileError) {
        console.error('❌ Database error while fetching user profile:', profileError);
      }
    } else {
      console.log('⚠️ No user_id found in transaction - user may not be logged in');
    }
    
    // PRIORITY 2: Fallback to transaction customer email
    if (!customerEmail) {
      console.log('🔍 Falling back to transaction customer email...');
      customerEmail = transaction.customer_email?.trim();
      customerName = 'Customer';
      emailSource = 'transaction_data';
      console.log('Using transaction email:', customerEmail);
    }
    
    // SECURITY: Validate email exists and is not empty
    if (!customerEmail || customerEmail.length === 0) {
      console.error('❌ No customer email found - cannot send confirmation email');
      return { success: false, error: 'No customer email found' };
    }
    
    // SECURITY: Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(customerEmail)) {
      console.error(`❌ Invalid email format: ${customerEmail}`);
      return { success: false, error: 'Invalid email format' };
    }
    
    // SECURITY: Check for placeholder/invalid emails
    const invalidEmails = [
      'guest@checkout.stripe.com',
      'test@example.com', 
      'user@example.com',
      'placeholder@example.com',
      'admin@example.com',
      'noreply@example.com'
    ];
    
    if (invalidEmails.includes(customerEmail.toLowerCase())) {
      console.error(`❌ Invalid placeholder email detected: ${customerEmail}`);
      return { success: false, error: 'Invalid placeholder email' };
    }
    
    // SECURITY: Log email source for audit trail
    console.log('📧 Email extraction summary:');
    console.log('   Source:', emailSource);
    console.log('   Email:', customerEmail);
    console.log('   Name:', customerName);
    console.log('   Transaction ID:', transaction.id);
    
    // SECURITY: Check if email service is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ Email service not configured - missing EMAIL_USER or EMAIL_PASS');
      return { success: false, error: 'Email service not configured' };
    }
    
    console.log('📧 Email service configuration verified');
    console.log('   SMTP User:', process.env.EMAIL_USER);
    console.log('   SMTP Pass:', process.env.EMAIL_PASS ? '***configured***' : 'NOT SET');

    // Import nodemailer with error handling
    let nodemailer;
    try {
      nodemailer = await import('nodemailer');
      console.log('✅ Nodemailer imported successfully');
    } catch (importError) {
      console.error('❌ Failed to import nodemailer:', importError);
      return { success: false, error: 'Failed to import email library' };
    }

    // Create Nodemailer transporter with Gmail SMTP (SECURE CONFIGURATION)
    let transporter;
    try {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false // Allow self-signed certificates
        }
      });
      console.log('✅ Nodemailer transporter created');
    } catch (transporterError) {
      console.error('❌ Failed to create transporter:', transporterError);
      return { success: false, error: 'Failed to create email transporter' };
    }

    // SECURITY: Verify SMTP connection before sending
    try {
      console.log('🔍 Verifying SMTP connection...');
      await transporter.verify();
      console.log('✅ SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('❌ SMTP connection verification failed:', verifyError);
      return { success: false, error: 'SMTP connection failed' };
    }

    // Prepare email content
    const sessionDate = booking.booking_date ? new Date(booking.booking_date).toLocaleDateString() : 'Not specified';
    const sessionTime = booking.booking_time || 'Not specified';
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
              <div><strong>Booking ID:</strong> ${booking.id}</div>
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

    // SECURITY: Prepare email with sanitized content
    const emailData = {
      from: `"Selling Infinity" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `✅ Booking Confirmed - ${productName}`,
      html: htmlContent,
      // Add security headers
      headers: {
        'X-Mailer': 'Selling Infinity Booking System',
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal'
      }
    };
    
    console.log('📧 Preparing to send email...');
    console.log('   To:', customerEmail);
    console.log('   From:', process.env.EMAIL_USER);
    console.log('   Subject:', emailData.subject);
    console.log('   Email Source:', emailSource);

    // SECURITY: Send email with comprehensive error handling
    let emailResult;
    try {
      console.log('📤 Sending confirmation email...');
      emailResult = await transporter.sendMail(emailData);
      console.log('✅ Confirmation email sent successfully!');
      console.log('   Message ID:', emailResult.messageId);
      console.log('   Response:', emailResult.response);
      console.log('   Accepted:', emailResult.accepted);
      console.log('   Rejected:', emailResult.rejected);
      
      // Log successful email for audit trail
      console.log('📋 EMAIL SENT SUCCESSFULLY:');
      console.log('   Transaction ID:', transaction.id);
      console.log('   Customer Email:', customerEmail);
      console.log('   Customer Name:', customerName);
      console.log('   Product:', productName);
      console.log('   Email Source:', emailSource);
      console.log('   Message ID:', emailResult.messageId);
      console.log('   Timestamp:', new Date().toISOString());
      
      return { 
        success: true, 
        messageId: emailResult.messageId,
        customerEmail: customerEmail,
        emailSource: emailSource
      };
      
    } catch (sendError) {
      console.error('❌ Failed to send confirmation email:', sendError);
      console.error('❌ Error details:', {
        message: sendError.message,
        code: sendError.code,
        response: sendError.response,
        customerEmail: customerEmail,
        fromEmail: process.env.EMAIL_USER,
        transactionId: transaction.id
      });
      
      // SECURITY: Handle specific error types
      let errorType = 'unknown';
      if (sendError.code === 'EENVELOPE') {
        errorType = 'invalid_recipient';
        console.error('❌ Invalid recipient email address:', customerEmail);
      } else if (sendError.code === 'EAUTH') {
        errorType = 'authentication_failed';
        console.error('❌ SMTP authentication failed - check EMAIL_USER and EMAIL_PASS');
      } else if (sendError.code === 'ECONNECTION') {
        errorType = 'connection_failed';
        console.error('❌ SMTP connection failed - check internet connection');
      } else if (sendError.code === 'ETIMEDOUT') {
        errorType = 'timeout';
        console.error('❌ SMTP timeout - server may be slow');
      }
      
      return { 
        success: false, 
        error: sendError.message,
        errorType: errorType,
        customerEmail: customerEmail,
        transactionId: transaction.id
      };
    }

  } catch (error) {
    console.error('❌ CRITICAL ERROR in sendConfirmationEmail:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Transaction ID:', transaction?.id);
    console.error('❌ Product:', product?.name);
    
    return { 
      success: false, 
      error: 'Critical error in email processing',
      details: error.message,
      transactionId: transaction?.id
    };
  }
}

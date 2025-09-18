import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { 
      productId, 
      selectedTimeSlot, 
      customerEmail, 
      createAccountAfterPurchase,
      reservationId,
      bookingDate,
      bookingTime,
      duration,
      userId // Add userId to capture from request
    } = await request.json();

    console.log('Creating checkout session for:', { 
      productId, 
      customerEmail, 
      userId,
      reservationId,
      bookingDate,
      bookingTime,
      createAccountAfterPurchase
    });

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Determine if user needs to create account after purchase
    // This is true if: explicitly requested OR user is not logged in (no userId)
    const shouldCreateAccount = createAccountAfterPurchase === true || (!userId && createAccountAfterPurchase !== false);
    console.log('Should create account after purchase:', shouldCreateAccount, { createAccountAfterPurchase, userId });

    // Get product from Supabase using admin client (no auth required)
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('Product fetch error:', productError);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Use provided email or placeholder for guest purchases
    const email = customerEmail || 'guest@checkout.stripe.com';

    // If we have userId and email, try to link them if not already linked
    if (userId && customerEmail) {
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .eq('id', userId)
        .single();

      if (existingProfile && existingProfile.email !== customerEmail) {
        console.log('Updating user email in profile:', { userId, customerEmail });
        await supabaseAdmin
          .from('profiles')
          .update({ email: customerEmail })
          .eq('id', userId);
      }
    }

    // Create Stripe checkout session
    const sessionData = {
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.price, // Price is already in cents from database
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}&setup_account=${shouldCreateAccount ? 'true' : 'false'}`,
      cancel_url: `${request.headers.get('origin')}/cancel`,
      metadata: {
        productId: productId,
        selectedTimeSlot: selectedTimeSlot || null,
        createAccountAfterPurchase: shouldCreateAccount,
        reservationId: reservationId || null,
        bookingDate: bookingDate || null,
        bookingTime: bookingTime || null,
        duration: duration || null,
        userId: userId || null, // Include userId in metadata
      },
    };

    // Add customer email if available, otherwise collect at checkout
    if (customerEmail) {
      sessionData.customer_email = customerEmail;
    } else {
      sessionData.customer_creation = 'always';
      sessionData.billing_address_collection = 'required';
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    // Only create transaction record if we have customer email
    // Otherwise, it will be created in the payment callback/webhook when we have the email
    let transactionId = null;
    
    if (customerEmail) {
      // Get booking token from reservation if available
      let bookingToken = null;
      if (reservationId) {
        try {
          const { data: reservation, error: reservationError } = await supabaseAdmin
            .from('booking_reservations')
            .select('booking_token')
            .eq('reservation_id', reservationId)
            .single();
          
          if (!reservationError && reservation) {
            bookingToken = reservation.booking_token;
            console.log('Found booking token from reservation:', bookingToken);
          }
        } catch (err) {
          console.log('Could not fetch booking token from reservation:', err.message);
        }
      }

      // Create transaction record with proper user_id linking and booking token
      const transactionData = {
        user_id: userId || null, // Use provided userId
        customer_email: customerEmail,
        product_id: productId,
        amount: product.price,
        status: 'pending',
        stripe_session_id: session.id,
        booking_token: bookingToken, // Include booking token for secure linking
        booking_timestamp: selectedTimeSlot ? new Date(selectedTimeSlot) : null
      };

      console.log('Creating transaction with data:', transactionData);

      const { error: transactionError, data: createdTransaction } = await supabaseAdmin
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();

      if (transactionError) {
        console.error('Transaction creation error:', transactionError);
        // Don't fail the checkout session creation, transaction will be created in webhook
        console.log('Transaction will be created in payment callback instead');
      } else {
        console.log('Created transaction:', createdTransaction);
        transactionId = createdTransaction.id;
      }
    } else {
      console.log('No customer email provided, transaction will be created in payment callback');
    }

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url,
      transactionId: transactionId // May be null if transaction created later
    });

  } catch (error) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

function initializeFirebaseAdmin() {
  if (getApps().length > 0) return;
  
  let serviceAccount;
  try {
    // Handle Vercel environment variable parsing issues
    let serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    // Fix newline issues that Vercel causes
    if (serviceAccountKey) {
      serviceAccountKey = serviceAccountKey.replace(/\\n/g, '\n');
    }
    
    serviceAccount = JSON.parse(serviceAccountKey);
    
    // Ensure private_key has proper newlines
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    
    console.log('Service account parsed successfully, project_id:', serviceAccount.project_id);
  } catch (err) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', err);
    console.error('Raw key length:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.length);
    throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY');
  }
  
  try {
    initializeApp({ credential: cert(serviceAccount) });
    console.log('Firebase Admin initialized successfully');
  } catch (err) {
    console.error('Failed to initialize Firebase Admin:', err);
    throw err;
  }
}

export async function POST(req) {
  try {
    const body = await req.text();
    const headersList = headers();
    const sig = headersList.get('stripe-signature');

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
      console.log(`Webhook signature verification failed.`, err.message);
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        // Parse metadata
        const cart = JSON.parse(session.metadata.cart || '[]');
        const selectedTimeSlot = session.metadata.selectedTimeSlot ? 
          JSON.parse(session.metadata.selectedTimeSlot) : null;
        
        // Initialize Firebase Admin
        initializeFirebaseAdmin();
        const db = getFirestore();
        
        // Save transaction to Firebase for download verification
        try {
          const transactionData = {
            stripeSessionId: session.id,
            email: session.customer_details?.email || '',
            customerName: session.customer_details?.name || '',
            cart: cart,
            amountTotal: session.amount_total / 100, // Convert from cents
            paymentStatus: 'completed',
            paymentMethod: 'stripe',
            createdAt: new Date().toISOString(),
            selectedTimeSlot: selectedTimeSlot
          };

          const result = await db.collection('transactions').add(transactionData);
          console.log('Transaction saved to Firebase:', session.id, 'DocID:', result.id);
        } catch (firebaseError) {
          console.error('Error saving transaction to Firebase:', firebaseError, firebaseError.stack);
        }
        
        // Check if coaching product was purchased
        const hasCoachingProduct = cart.some(item => 
          item.name?.toLowerCase().includes('coaching')
        );

        if (hasCoachingProduct && selectedTimeSlot) {
          // Create booking in Firebase
          try {
            const bookingData = {
              id: `stripe_${session.id}`,
              customerEmail: session.customer_details?.email || '',
              customerName: session.customer_details?.name || '',
              sessionStart: selectedTimeSlot.start,
              sessionEnd: selectedTimeSlot.end,
              productName: cart.find(item => item.name?.toLowerCase().includes('coaching'))?.name || 'Coaching Session',
              amountPaid: session.amount_total / 100, // Convert from cents
              paymentStatus: 'paid',
              paymentMethod: 'stripe',
              stripeSessionId: session.id,
              createdAt: new Date().toISOString(),
            };

            // Save booking to Firebase
            await db.collection('bookings').add(bookingData);
            console.log('Booking saved to Firebase:', bookingData);

            // Send notification email to you (admin)
            try {
              const adminNotificationData = {
                type: 'new_booking',
                adminEmail: 'your-email@example.com', // TODO: Replace with your actual email
                customerName: session.customer_details?.name || 'Unknown',
                customerEmail: session.customer_details?.email || '',
                sessionDate: new Date(selectedTimeSlot.start).toLocaleDateString(),
                sessionTime: new Date(selectedTimeSlot.start).toLocaleTimeString(),
                productName: cart.find(item => item.name?.toLowerCase().includes('coaching'))?.name || 'Coaching Session',
                amountPaid: session.amount_total / 100,
                bookingId: `stripe_${session.id}`
              };

              await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-admin-notification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(adminNotificationData)
              });
              
              console.log('Admin notification sent for new booking');
            } catch (notificationError) {
              console.error('Error sending admin notification:', notificationError);
            }
            
          } catch (bookingError) {
            console.error('Error creating booking:', bookingError);
          }
        }

        // Send confirmation email
        try {
          const emailData = {
            customerEmail: session.customer_details?.email,
            customerName: session.customer_details?.name,
            cart,
            selectedTimeSlot,
            transactionId: session.id,
            amountPaid: session.amount_total / 100
          };

          // Call your existing email API
          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailData)
          });
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
        }

        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}

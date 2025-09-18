import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function initializeFirebaseAdmin() {
  if (getApps().length > 0) return;
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  initializeApp({ credential: cert(serviceAccount) });
}

export async function POST(request) {
  try {
    initializeFirebaseAdmin();
    const { transactionId } = await request.json();

    if (!transactionId) {
      return new Response(JSON.stringify({ message: 'Transaction ID is required.' }), { status: 400 });
    }

    const db = getFirestore();
    const transRef = db.collection('transactions').where('paypalOrderId', '==', transactionId.trim());
    const transSnapshot = await transRef.get();

    if (transSnapshot.empty) {
      return new Response(JSON.stringify({ message: 'Purchase not found. Please check your Transaction ID and try again.' }), { status: 404 });
    }
    
    // If we find the transaction, it's valid.
    return new Response(JSON.stringify({ success: true, message: 'Verification successful.' }), { status: 200 });

  } catch (error) {
    console.error("Purchase Verification Error:", error);
    return new Response(JSON.stringify({ message: 'An internal server error occurred.' }), { status: 500 });
  }
}
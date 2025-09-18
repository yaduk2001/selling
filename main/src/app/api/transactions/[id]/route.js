// FILE: app/api/transactions/[id]/route.js
// ACTION: This version has been updated to be a public endpoint, removing the user login check.

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function initializeFirebaseAdmin() {
  if (getApps().length > 0) return;
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  initializeApp({ credential: cert(serviceAccount) });
}

// This function handles GET requests to /api/transactions/[some-id]
export async function GET(request, { params }) {
    try {
        initializeFirebaseAdmin();
        const db = getFirestore();
        const { id } = params; // The transaction ID from the URL

        if (!id) {
            return new Response(JSON.stringify({ error: 'Transaction ID is required.' }), { status: 400 });
        }

        // Query for the document where the paypalOrderId matches the ID from the URL
        const q = db.collection('transactions').where('paypalOrderId', '==', id);
        const snapshot = await q.get();

        if (snapshot.empty) {
            return new Response(JSON.stringify({ error: 'Transaction not found or invalid.' }), { status: 404 });
        }

        const transactionData = snapshot.docs[0].data();
        
        // Since there is no user login, we simply return the data.
        return new Response(JSON.stringify(transactionData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error("Error fetching transaction:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch transaction details." }), { status: 500 });
    }
}

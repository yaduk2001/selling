import { promises as fs } from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transaction_id');
    const sessionId = searchParams.get('session_id'); // Stripe session ID
    const email = searchParams.get('email'); // Email parameter for re-downloads

    if (!transactionId && !sessionId && !email) {
      return new Response(JSON.stringify({ error: 'Transaction ID, Session ID, or email is required.' }), { status: 400 });
    }

    // 1. Verify the transaction/session exists in Supabase
    let query = supabaseAdmin
      .from('transactions')
      .select(`
        id,
        status,
        customer_email,
        stripe_session_id,
        products (
          id,
          name,
          type
        )
      `);

    if (email) {
      // Check for any purchase by this email
      query = query.eq('customer_email', email).eq('status', 'completed');
    } else if (sessionId) {
      // Check for Stripe session
      query = query.eq('stripe_session_id', sessionId).eq('status', 'completed');
    } else {
      // Legacy transaction ID support (keeping for backward compatibility)
      query = query.eq('id', transactionId).eq('status', 'completed');
    }

    const { data: transactions, error: transactionError } = await query;

    if (transactionError) {
      console.error('Error querying transactions:', transactionError);
      return new Response(JSON.stringify({ error: 'Database error occurred.' }), { status: 500 });
    }

    // 2. If no valid purchases found, block the download
    if (!transactions || transactions.length === 0) {
      if (email) {
        return new Response(JSON.stringify({ error: 'No completed purchases found for this email address.' }), { status: 404 });
      }
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid or incomplete purchase.' }), { status: 403 });
    }

    // Find a PDF product in the transactions
    const pdfTransaction = transactions.find(t => 
      t.products?.type === 'pdf' || t.products?.type === 'digital_product'
    );

    if (!pdfTransaction) {
      return new Response(JSON.stringify({ error: 'No PDF products found in your purchases.' }), { status: 404 });
    }

    // 3. If the purchase is valid, find and serve the PDF
    // Since we don't have file_url in the products table, use the default PDF
    const pdfPath = path.join(process.cwd(), 'IMPACT.pdf');

    const pdfBuffer = await fs.readFile(pdfPath);

    // Get filename for download
    const filename = pdfTransaction.products?.name ? 
      `${pdfTransaction.products.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf` : 
      'IMPACT.pdf';

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("PDF Download Error:", error);
    if (error.code === 'ENOENT') {
        return new Response(JSON.stringify({ error: 'File not found on server.' }), { status: 404 });
    }
    return new Response(JSON.stringify({ error: 'An internal server error occurred.' }), { status: 500 });
  }
}
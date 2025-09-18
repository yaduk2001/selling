// Test script to debug PDF download issue
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPDFDownload() {
  try {
    console.log('Testing PDF download flow...');
    
    // Check for any completed transactions
    const { data: transactions, error } = await supabaseAdmin
      .from('transactions')
      .select(`
        id,
        status,
        customer_email,
        stripe_session_id,
        products (
          id,
          name,
          type,
          file_url
        )
      `)
      .eq('status', 'completed')
      .limit(5);

    if (error) {
      console.error('Error querying transactions:', error);
      return;
    }

    console.log('Found transactions:', transactions);
    
    if (transactions && transactions.length > 0) {
      const pdfTransaction = transactions.find(t => 
        t.products?.type === 'pdf' || t.products?.type === 'digital_product'
      );
      
      if (pdfTransaction) {
        console.log('Found PDF transaction:', pdfTransaction);
      } else {
        console.log('No PDF transactions found in completed transactions');
      }
    } else {
      console.log('No completed transactions found');
    }

  } catch (err) {
    console.error('Test error:', err);
  }
}

testPDFDownload();

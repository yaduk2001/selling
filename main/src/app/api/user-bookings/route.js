import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email');
    const userId = searchParams.get('user_id');

    console.log('Loading bookings for user:', { userEmail, userId });

    // Query only confirmed bookings from bookings table
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        products (
          name,
          price,
          type
        )
      `)
      .or(`user_id.eq.${userId},customer_email.eq.${userEmail}`)
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return NextResponse.json({ 
        error: 'Failed to load bookings',
        details: bookingsError.message 
      }, { status: 500 });
    }

    console.log(`Found ${bookings?.length || 0} confirmed bookings for user`);

    return NextResponse.json({ 
      bookings: bookings || [],
      success: true
    });  } catch (error) {
    console.error('Error in user-bookings API:', error);
    return NextResponse.json({ 
      bookings: [],
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

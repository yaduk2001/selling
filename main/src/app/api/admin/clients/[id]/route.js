import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    // The 'id' is the client's email. We need to update all bookings with this email.
    const { error } = await supabaseAdmin
      .from('bookings')
      .update({ customer_name: name })
      .eq('customer_email', id);

    if (error) {
      console.error('Error updating client name:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update client name: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Client name updated successfully'
    });

  } catch (error) {
    console.error('Error in client update API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

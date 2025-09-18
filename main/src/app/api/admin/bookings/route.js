import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    // Get all bookings with product and transaction details
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        products (
          name,
          type,
          price
        ),
        transactions (
          amount,
          status,
          stripe_session_id
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin bookings:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch bookings' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      bookings: bookings || []
    });

  } catch (error) {
    console.error('Error in admin bookings API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { bookingId, status } = await request.json();

    if (!bookingId || !status) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing bookingId or status' 
      }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['confirmed', 'completed', 'cancelled', 'no_show'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid status' 
      }, { status: 400 });
    }

    // Update booking status
    const { data: updatedBooking, error } = await supabaseAdmin
      .from('bookings')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking status:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update booking' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      booking: updatedBooking 
    });

  } catch (error) {
    console.error('Error in admin bookings PATCH:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing bookingId' 
      }, { status: 400 });
    }

    // Delete the booking
    const { error } = await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (error) {
      console.error('Error deleting booking:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to delete booking' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Booking deleted successfully' 
    });

  } catch (error) {
    console.error('Error in admin bookings DELETE:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

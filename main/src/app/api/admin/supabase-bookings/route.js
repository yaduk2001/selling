// FILE: app/api/admin/supabase-bookings/route.js
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request) {
  try {
    const supabase = createAdminClient();
    
    // Get all bookings from Supabase
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    // Process bookings data
    const stats = {
      totalBookings: bookings.length,
      totalRevenue: bookings.reduce((sum, booking) => sum + (booking.amount || 0), 0),
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      completedBookings: bookings.filter(b => b.status === 'completed').length,
    };

    return NextResponse.json({
      bookings,
      stats
    });

  } catch (error) {
    console.error('Error in admin bookings API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from('bookings')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    return NextResponse.json({ booking: data });

  } catch (error) {
    console.error('Error in admin bookings POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking:', error);
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    return NextResponse.json({ booking: data });

  } catch (error) {
    console.error('Error in admin bookings PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting booking:', error);
      return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Booking deleted successfully' });

  } catch (error) {
    console.error('Error in admin bookings DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

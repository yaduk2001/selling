import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event ID is required' 
      }, { status: 400 });
    }

    // Delete the blocked event from calendar_events table
    const { error } = await supabaseAdmin
      .from('calendar_events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting busy slot:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to delete busy slot' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Busy slot deleted successfully'
    });

  } catch (error) {
    console.error('Error in delete busy slot API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

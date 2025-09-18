import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { sendEmail, userName, userEmail } = await request.json();

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    // Ban the user by setting banned_until to a future date (1 year from now)
    const bannedUntil = new Date();
    bannedUntil.setFullYear(bannedUntil.getFullYear() + 1);

    const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      banned_until: bannedUntil.toISOString()
    });

    if (banError) {
      console.error('Error banning user:', banError);
      return NextResponse.json({
        success: false,
        error: 'Failed to ban user: ' + banError.message
      }, { status: 500 });
    }

    // Cancel any future bookings for this user
    const { error: cancelError } = await supabaseAdmin
      .from('bookings')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: 'User account banned'
      })
      .eq('email', userEmail)
      .gte('slot_datetime', new Date().toISOString());

    if (cancelError) {
      console.error('Error cancelling bookings:', cancelError);
      // Don't fail the ban if booking cancellation fails
    }

    // TODO: Send email notification if sendEmail is true
    if (sendEmail) {
      // Email notification would go here
      console.log(`Would send ban notification email to ${userEmail}`);
    }

    return NextResponse.json({
      success: true,
      message: `User ${userName} has been banned successfully`
    });

  } catch (error) {
    console.error('Error in ban user API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    // Unban the user by removing banned_until
    const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      banned_until: null
    });

    if (unbanError) {
      console.error('Error unbanning user:', unbanError);
      return NextResponse.json({
        success: false,
        error: 'Failed to unban user: ' + unbanError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'User has been unbanned successfully'
    });

  } catch (error) {
    console.error('Error in unban user API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

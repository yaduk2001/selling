import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Email transporter setup
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export async function GET(request) {
  try {
    // Get users from auth.users along with metadata
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching auth users:', authError);
      // Fallback to profiles table
      const { data: profileUsers, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileError) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch users' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        users: profileUsers.map(user => ({
          id: user.id,
          email: user.email,
          name: user.full_name || user.name || '',
          email_confirmed: true,
          last_sign_in_at: user.last_sign_in_at,
          created_at: user.created_at,
          banned: false,
          total_bookings: 0,
          total_spent: 0
        }))
      });
    }

    // Enrich with booking data and deduplicate by email
    const userMap = new Map();
    
    for (const user of authUsers.users) {
      // Get booking count and total spent
      const { data: bookings } = await supabaseAdmin
        .from('bookings')
        .select('id, created_at')
        .eq('email', user.email);

      const { data: transactions } = await supabaseAdmin
        .from('transactions')
        .select('amount')
        .eq('customer_email', user.email);

      const totalSpent = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      const enrichedUser = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.user_metadata?.full_name || '',
        email_confirmed: user.email_confirmed_at !== null,
        last_sign_in_at: user.last_sign_in_at,
        created_at: user.created_at,
        banned: user.banned_until !== null && new Date(user.banned_until) > new Date(),
        banned_until: user.banned_until,
        total_bookings: bookings?.length || 0,
        total_spent: totalSpent / 100 // Convert from cents
      };

      // Keep only the most recent user for each email (or the non-banned one if there's a choice)
      const existing = userMap.get(user.email);
      if (!existing || 
          (!enrichedUser.banned && existing.banned) || 
          (enrichedUser.banned === existing.banned && new Date(enrichedUser.created_at) > new Date(existing.created_at))) {
        userMap.set(user.email, enrichedUser);
      }
    }

    const enrichedUsers = Array.from(userMap.values());

    return NextResponse.json({
      success: true,
      users: enrichedUsers
    });

  } catch (error) {
    console.error('Error in admin users API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Delete user account
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    const sendEmail = searchParams.get('sendEmail') === 'true';

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user details before deletion
    const { data: userDetails } = await supabaseAdmin.auth.admin.getUserById(userId);

    // Delete user from auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    // Send email notification if requested
    if (sendEmail && userDetails?.user?.email) {
      try {
        const transporter = createTransporter();
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: userDetails.user.email,
          subject: 'Account Deletion Notification',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #f97316;">Account Deleted</h2>
              <p>Your account has been deleted by an administrator.</p>
              <p>If you believe this was done in error, please contact our support team.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 14px;">This is an automated message. Please do not reply.</p>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Error sending deletion email:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE users API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Ban/unban user
export async function PUT(request) {
  try {
    const { userId, action, duration, sendEmail } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: 'User ID and action are required' },
        { status: 400 }
      );
    }

    // Get user details
    const { data: userDetails } = await supabaseAdmin.auth.admin.getUserById(userId);

    let banUntil = null;
    let emailSubject = '';
    let emailContent = '';

    if (action === 'ban') {
      // Calculate ban duration
      const now = new Date();
      switch (duration) {
        case '1day':
          banUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          break;
        case '7days':
          banUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          banUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
        case 'permanent':
          banUntil = new Date('2099-12-31');
          break;
        default:
          banUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      }

      emailSubject = 'Account Suspended';
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f97316;">Account Suspended</h2>
          <p>Your account has been temporarily suspended.</p>
          <p><strong>Suspension Duration:</strong> ${duration === 'permanent' ? 'Permanent' : duration}</p>
          ${duration !== 'permanent' ? `<p><strong>Suspension Ends:</strong> ${banUntil.toLocaleDateString()}</p>` : ''}
          <p>If you have any questions, please contact our support team.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">This is an automated message. Please do not reply.</p>
        </div>
      `;
    } else if (action === 'unban') {
      emailSubject = 'Account Reinstated';
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">Account Reinstated</h2>
          <p>Your account suspension has been lifted.</p>
          <p>You can now access your account normally.</p>
          <p>Thank you for your patience.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">This is an automated message. Please do not reply.</p>
        </div>
      `;
    }

    // Update user ban status
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: banUntil ? banUntil.toISOString() : 'none'
    });

    if (updateError) {
      console.error('Error updating user ban status:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update user status' },
        { status: 500 }
      );
    }

    // Send email notification if requested
    if (sendEmail && userDetails?.user?.email) {
      try {
        const transporter = createTransporter();
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: userDetails.user.email,
          subject: emailSubject,
          html: emailContent
        });
      } catch (emailError) {
        console.error('Error sending ban/unban email:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `User ${action === 'ban' ? 'banned' : 'unbanned'} successfully`
    });

  } catch (error) {
    console.error('Error in PUT users API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Bulk user operations
export async function POST(request) {
  try {
    const { action, userIds, sendEmails } = await request.json();

    if (!action || !userIds || !Array.isArray(userIds)) {
      return NextResponse.json(
        { success: false, error: 'Action and user IDs are required' },
        { status: 400 }
      );
    }

    const results = [];

    for (const userId of userIds) {
      try {
        if (action === 'delete') {
          // Delete user
          const { data: userDetails } = await supabaseAdmin.auth.admin.getUserById(userId);
          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

          if (deleteError) {
            results.push({ userId, success: false, error: deleteError.message });
            continue;
          }

          // Send email if requested
          if (sendEmails && userDetails?.user?.email) {
            try {
              const transporter = createTransporter();
              await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: userDetails.user.email,
                subject: 'Account Deletion Notification',
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #f97316;">Account Deleted</h2>
                    <p>Your account has been deleted by an administrator.</p>
                    <p>If you believe this was done in error, please contact our support team.</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #6b7280; font-size: 14px;">This is an automated message. Please do not reply.</p>
                  </div>
                `
              });
            } catch (emailError) {
              console.error('Error sending bulk deletion email:', emailError);
            }
          }

          results.push({ userId, success: true });

        } else if (action === 'ban') {
          // Ban user
          const banUntil = new Date();
          banUntil.setDate(banUntil.getDate() + 7); // 7 days default

          const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            ban_duration: banUntil.toISOString()
          });

          if (banError) {
            results.push({ userId, success: false, error: banError.message });
            continue;
          }

          results.push({ userId, success: true });
        }
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Bulk operation completed: ${successCount} succeeded, ${failureCount} failed`,
      results
    });

  } catch (error) {
    console.error('Error in POST users API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

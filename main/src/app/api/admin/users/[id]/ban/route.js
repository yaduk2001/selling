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

    // Send email notification if sendEmail is true
    if (sendEmail && userEmail) {
      try {
        // Get the account suspended template
        const { data: template, error: templateError } = await supabaseAdmin
          .from('email_templates')
          .select('*')
          .eq('template_type', 'account')
          .eq('name', 'Account Suspended')
          .single();

        if (templateError || !template) {
          console.error('Account suspended template not found:', templateError);
          // Fallback to simple email
          const nodemailer = await import('nodemailer');
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });

          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: '⚠️ Account Suspended - Action Required',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
                <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">Account Suspended</h1>
                  <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 16px;">Important notice regarding your account</p>
                </div>
                
                <div style="padding: 40px 20px;">
                  <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
                    Hi ${userName || 'User'},
                  </p>
                  
                  <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                    We are writing to inform you that your account has been temporarily suspended due to a violation of our terms of service.
                  </p>
                  
                  <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 30px; margin: 30px 0;">
                    <h3 style="color: #dc2626; margin: 0 0 20px 0; font-size: 20px;">⚠️ Suspension Details</h3>
                    <div style="display: grid; gap: 15px;">
                      <div><strong>Reason:</strong> Terms of service violation</div>
                      <div><strong>Duration:</strong> 1 year</div>
                      <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
                      <div><strong>Account:</strong> ${userEmail}</div>
                    </div>
                  </div>
                  
                  <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                    If you have any questions or concerns about this suspension, please contact our support team immediately.
                  </p>
                </div>
                
                <div style="background: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">
                    Best regards,<br>
                    <strong>Selling Infinity Support Team</strong>
                  </p>
                </div>
              </div>
            `
          });
        } else {
          // Use the template with placeholders
          const nodemailer = await import('nodemailer');
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });

          // Replace placeholders in the template
          let emailContent = template.html_content;
          emailContent = emailContent.replace(/\{\{customer_name\}\}/g, userName || 'User');
          emailContent = emailContent.replace(/\{\{customer_email\}\}/g, userEmail);
          emailContent = emailContent.replace(/\{\{suspension_reason\}\}/g, 'Terms of service violation');
          emailContent = emailContent.replace(/\{\{suspension_duration\}\}/g, '1 year');
          emailContent = emailContent.replace(/\{\{suspension_date\}\}/g, new Date().toLocaleDateString());
          emailContent = emailContent.replace(/\{\{support_link\}\}/g, process.env.NEXT_PUBLIC_SITE_URL + '/contact');

          let emailSubject = template.subject;
          emailSubject = emailSubject.replace(/\{\{customer_name\}\}/g, userName || 'User');

          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: emailSubject,
            html: emailContent
          });
        }

        console.log(`Account suspended email sent to ${userEmail}`);
      } catch (emailError) {
        console.error('Error sending account suspended email:', emailError);
      }
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

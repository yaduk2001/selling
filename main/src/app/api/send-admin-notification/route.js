import { NextResponse } from 'next/server';
// COMMENTED OUT: Resend import - requires RESEND_API_KEY
// import { Resend } from 'resend';

export async function POST(request) {
  try {
    const data = await request.json();
    const { type } = data;
    
    if (type === 'booking_confirmation') {
      // COMMENTED OUT: Resend logic - requires RESEND_API_KEY
      // const resend = new Resend(process.env.RESEND_API_KEY);

      // if (!process.env.RESEND_API_KEY) {
      //   console.error('RESEND_API_KEY not configured');
      //   return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
      // }

      const adminEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f97316;">🎉 New Coaching Session Booked!</h2>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Booking Details</h3>
            <p><strong>Customer:</strong> ${data.customerName}</p>
            <p><strong>Email:</strong> ${data.customerEmail}</p>
            <p><strong>Date:</strong> ${data.sessionDate}</p>
            <p><strong>Time:</strong> ${data.sessionTime}</p>
            <p><strong>Service:</strong> ${data.productName}</p>
            <p><strong>Amount:</strong> $${data.amountPaid}</p>
            <p><strong>Booking ID:</strong> ${data.bookingId}</p>
          </div>
          
          <div style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <p style="margin: 0;"><strong>Next Steps:</strong></p>
            <ul style="margin: 10px 0;">
              <li>Add this session to your personal calendar</li>
              <li>Prepare materials for the coaching session</li>
              <li>Send a confirmation email to the customer if needed</li>
            </ul>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              This notification was sent automatically when a customer booked a coaching session.
            </p>
          </div>
        </div>
      `;

      // COMMENTED OUT: Resend email sending - requires RESEND_API_KEY
      // const { data: emailData, error } = await resend.emails.send({
      //   from: 'Selling Infinity <noreply@sellinginfinity.com>',
      //   to: [data.adminEmail],
      //   subject: `🔔 New Coaching Booking - ${data.customerName} (${data.sessionDate})`,
      //   html: adminEmailHtml
      // });

      // if (error) {
      //   console.error('Error sending admin notification:', error);
      //   return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
      // }

      // console.log('Admin notification email sent successfully');
      // return NextResponse.json({ success: true });
      
      // TEMPORARY: Return success without sending email (RESEND_API_KEY not configured)
      console.log('Admin notification skipped - RESEND_API_KEY not configured');
      return NextResponse.json({ success: true, message: 'Notification skipped - email service not configured' });
    }

    return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
  } catch (error) {
    console.error('Admin notification error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}

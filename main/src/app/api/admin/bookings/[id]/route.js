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

// Update booking
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { type, ...data } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Booking ID is required' }, { status: 400 });
    }

    if (type === 'status') {
      const { action, status, sendEmail, customerName, customerEmail } = data;

      // Get booking details before updating
      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select(`
          *,
          products (
            name,
            type,
            price
          )
        `)
        .eq('id', id)
        .single();

      if (fetchError || !booking) {
        return NextResponse.json({
          success: false,
          error: 'Booking not found'
        }, { status: 404 });
      }

      // Update booking status
      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({
          status: status,
          updated_at: new Date().toISOString(),
          admin_action: action,
          admin_notes: `Booking ${action}ed by admin at ${new Date().toISOString()}`
        })
        .eq('id', id);

      if (updateError) {
        console.error('Error updating booking:', updateError);
        return NextResponse.json({
          success: false,
          error: 'Failed to update booking'
        }, { status: 500 });
      }

      // Send email notification if requested
      if (sendEmail && (customerEmail || booking.email || booking.customer_email)) {
        try {
          const emailAddress = customerEmail || booking.email || booking.customer_email;
          const name = customerName || booking.name || booking.customer_name || 'Customer';
          const serviceName = booking.products?.name || 'Service';
          const bookingDate = booking.booking_date ? new Date(booking.booking_date).toLocaleDateString() : 'Not specified';
          const bookingTime = booking.booking_time || 'Not specified';

          const transporter = createTransporter();

          let subject, htmlContent;

          switch (action) {
            case 'confirm':
              subject = `✅ Booking Confirmed - ${serviceName}`;
              htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Booking Confirmed!</h1>
                  </div>
                  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
                    <h2 style="color: #000000; margin-bottom: 20px;">Hello ${name},</h2>
                    <p style="color: #000000; font-size: 16px; line-height: 1.6;">
                      Great news! Your booking has been <strong>confirmed</strong> by our team.
                    </p>

                    <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #d1d5db; margin: 20px 0;">
                      <h3 style="color: #000000; margin-top: 0;">Booking Details:</h3>
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 8px 0; color: #000000; width: 120px;"><strong>Service:</strong></td>
                          <td style="padding: 8px 0; color: #000000;">${serviceName}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #000000;"><strong>Date:</strong></td>
                          <td style="padding: 8px 0; color: #000000;">${bookingDate}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #000000;"><strong>Time:</strong></td>
                          <td style="padding: 8px 0; color: #000000;">${bookingTime}</td>
                        </tr>
                      </table>
                    </div>

                    <p style="color: #000000; font-size: 16px; line-height: 1.6;">
                      We look forward to serving you! If you have any questions, please contact our support team.
                    </p>
                  </div>
                </div>
              `;
              break;

            case 'reject':
              subject = `❌ Booking Update - ${serviceName}`;
              htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">📋 Booking Update</h1>
                  </div>
                  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
                    <h2 style="color: #000000; margin-bottom: 20px;">Hello ${name},</h2>
                    <p style="color: #000000; font-size: 16px; line-height: 1.6;">
                      We regret to inform you that we cannot accommodate your booking request at this time.
                    </p>
                    <p style="color: #000000; font-size: 16px; line-height: 1.6;">
                      Please feel free to contact us to discuss alternative dates and times.
                    </p>
                  </div>
                </div>
              `;
              break;

            case 'cancel':
              subject = `🚫 Booking Cancelled - ${serviceName}`;
              htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🚫 Booking Cancelled</h1>
                  </div>
                  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
                    <h2 style="color: #000000; margin-bottom: 20px;">Hello ${name},</h2>
                    <p style="color: #000000; font-size: 16px; line-height: 1.6;">
                      Your booking has been cancelled as requested.
                    </p>
                    <p style="color: #000000; font-size: 16px; line-height: 1.6;">
                      If you have any questions about this cancellation, please contact our support team.
                    </p>
                  </div>
                </div>
              `;
              break;
          }

          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: emailAddress,
            subject: subject,
            html: htmlContent
          });

          console.log(`Email sent successfully to ${emailAddress} for ${action} action`);
        } catch (emailError) {
          console.error('Error sending email:', emailError);
          // Don't fail the request if email fails
        }
      }
    } else {
      const { customer_name, customer_email, booking_date, booking_time, duration_minutes, status } = data;
      const { error } = await supabaseAdmin
        .from('bookings')
        .update({
          customer_name,
          customer_email,
          booking_date,
          booking_time,
          duration_minutes,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating booking details:', error);
        return NextResponse.json({ success: false, error: 'Failed to update booking details' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Booking updated successfully' });

  } catch (error) {
    console.error('Error in booking update:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Booking ID is required' 
      }, { status: 400 });
    }

    // Delete the booking
    const { error } = await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('id', id);

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
    console.error('Error in delete booking API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Create email transporter
const createTransporter = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return null;
};

export async function POST(request) {
  try {
    const { type = 'manual' } = await request.json(); // 'manual' or 'automatic'
    
    console.log(`Sending session reminders (${type})...`);

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    // Get bookings for tomorrow
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        products (
          name,
          price,
          duration
        )
      `)
      .eq('booking_date', tomorrowDate)
      .eq('status', 'confirmed');

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No sessions scheduled for tomorrow',
        sent: 0
      });
    }

    // Get email template
    const { data: template, error: templateError } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('template_key', 'booking_reminder')
      .single();

    if (templateError || !template) {
      console.error('Error fetching reminder template:', templateError);
      return NextResponse.json(
        { success: false, error: 'Email template not found' },
        { status: 500 }
      );
    }

    // Check if email service is configured
    const transporter = createTransporter();
    if (!transporter) {
      return NextResponse.json(
        { success: false, error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Send reminders
    const results = [];
    for (const booking of bookings) {
      try {
        // Replace placeholders in template
        const personalizedSubject = template.subject.replace(/\{(\w+)\}/g, (match, key) => {
          const replacements = {
            customerName: booking.customer_name || 'Customer',
            sessionDate: new Date(booking.booking_date).toLocaleDateString(),
            sessionTime: booking.booking_time,
            productName: booking.products?.name || 'Service'
          };
          return replacements[key] || match;
        });

        const personalizedContent = template.content.replace(/\{(\w+)\}/g, (match, key) => {
          const replacements = {
            customerName: booking.customer_name || 'Customer',
            sessionDate: new Date(booking.booking_date).toLocaleDateString(),
            sessionTime: booking.booking_time,
            productName: booking.products?.name || 'Service',
            duration: booking.products?.duration || 60,
            meetingLink: booking.meeting_link || 'TBD'
          };
          return replacements[key] || match;
        });

        // Send email
        const info = await transporter.sendMail({
          from: `"Selling Infinity" <${process.env.EMAIL_USER}>`,
          to: booking.customer_email,
          subject: personalizedSubject,
          html: personalizedContent,
        });

        results.push({
          success: true,
          bookingId: booking.id,
          customerEmail: booking.customer_email,
          messageId: info.messageId
        });

        console.log(`Reminder sent to ${booking.customer_email} for booking ${booking.id}`);

      } catch (error) {
        console.error(`Failed to send reminder to ${booking.customer_email}:`, error);
        results.push({
          success: false,
          bookingId: booking.id,
          customerEmail: booking.customer_email,
          error: error.message
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    // Log the reminder operation
    await supabaseAdmin
      .from('email_logs')
      .insert({
        action: 'session_reminders',
        template_key: 'booking_reminder',
        recipients_count: bookings.length,
        successful_sends: successful,
        failed_sends: failed
      });

    return NextResponse.json({
      success: true,
      message: `Session reminders sent: ${successful} successful, ${failed} failed`,
      results: {
        total: bookings.length,
        successful,
        failed,
        details: results
      }
    });

  } catch (error) {
    console.error('Error sending session reminders:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Get tomorrow's bookings for preview
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        customer_name,
        customer_email,
        booking_date,
        booking_time,
        status,
        products (
          name,
          duration
        )
      `)
      .eq('booking_date', tomorrowDate)
      .eq('status', 'confirmed');

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tomorrowDate,
      bookings: bookings || [],
      count: bookings?.length || 0
    });

  } catch (error) {
    console.error('Error fetching reminder preview:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

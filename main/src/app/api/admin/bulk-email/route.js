import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// COMMENTED OUT: Resend import - requires RESEND_API_KEY
// import { Resend } from 'resend';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { action, templateKey, customFilters } = await request.json();

    if (!action || !templateKey) {
      return NextResponse.json(
        { success: false, error: 'Action and template are required' },
        { status: 400 }
      );
    }

    // Get the email template
    const { data: templateData, error: templateError } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('template_key', templateKey)
      .single();

    if (templateError || !templateData) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    let recipients = [];

    // Define different recipient selection logic based on action
    switch (action) {
      case 'send_to_all_clients':
        // Get all customers from bookings
        const { data: allClients } = await supabaseAdmin
          .from('bookings')
          .select('customer_name, customer_email, booking_date, booking_time, product_name')
          .eq('status', 'confirmed')
          .order('created_at', { ascending: false });
        
        // Remove duplicates by email
        const uniqueClients = allClients?.reduce((acc, client) => {
          if (!acc.find(c => c.customer_email === client.customer_email)) {
            acc.push(client);
          }
          return acc;
        }, []) || [];
        
        recipients = uniqueClients;
        break;

      case 'send_reminders_tomorrow':
        // Get bookings for tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = tomorrow.toISOString().split('T')[0];
        
        const { data: tomorrowBookings } = await supabaseAdmin
          .from('bookings')
          .select('customer_name, customer_email, booking_date, booking_time, product_name')
          .eq('booking_date', tomorrowString)
          .eq('status', 'confirmed');
        
        recipients = tomorrowBookings || [];
        break;

      case 'notify_schedule_changes':
        // Get recent bookings that might need notifications
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        
        const { data: recentBookings } = await supabaseAdmin
          .from('bookings')
          .select('customer_name, customer_email, booking_date, booking_time, product_name')
          .gte('created_at', lastWeek.toISOString())
          .eq('status', 'confirmed');
        
        recipients = recentBookings || [];
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    if (recipients.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No recipients found for the selected criteria',
        sent: 0
      });
    }

    // COMMENTED OUT: Resend initialization - requires RESEND_API_KEY
    // const resend = new Resend(process.env.RESEND_API_KEY);

    // if (!process.env.RESEND_API_KEY) {
    //   return NextResponse.json(
    //     { success: false, error: 'Email service not configured' },
    //     { status: 500 }
    //   );
    // }

    // Send emails to all recipients
    const sendPromises = recipients.map(async (recipient) => {
      try {
        // Replace placeholders in subject and content
        const personalizedSubject = templateData.subject.replace(/\{(\w+)\}/g, (match, key) => {
          const value = recipient[`customer_${key}`] || recipient[key] || recipient[`session_${key}`] || recipient[`product_${key}`];
          return value || match;
        });

        const personalizedContent = templateData.content.replace(/\{(\w+)\}/g, (match, key) => {
          const value = recipient[`customer_${key}`] || recipient[key] || recipient[`session_${key}`] || recipient[`product_${key}`];
          return value || match;
        });

        const { data, error } = await resend.emails.send({
          from: 'Selling Infinity <noreply@sellinginfinity.com>',
          to: [recipient.customer_email],
          subject: personalizedSubject,
          html: personalizedContent
        });

        if (error) {
          throw new Error(error.message);
        }

        return { success: true, email: recipient.customer_email };
      } catch (error) {
        console.error(`Failed to send email to ${recipient.customer_email}:`, error);
        return { success: false, email: recipient.customer_email, error: error.message };
      }
    });

    const results = await Promise.all(sendPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    // Log the bulk send operation
    await supabaseAdmin
      .from('email_logs')
      .insert({
        action,
        template_key: templateKey,
        recipients_count: recipients.length,
        successful_sends: successful,
        failed_sends: failed,
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      message: `Bulk email completed: ${successful} sent, ${failed} failed`,
      sent: successful,
      failed: failed,
      totalRecipients: recipients.length
    });

  } catch (error) {
    console.error('Error in bulk email API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

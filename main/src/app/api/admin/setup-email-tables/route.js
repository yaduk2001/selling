import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { action } = await request.json();

    if (action === 'create_email_tables') {
      // Create email templates table
      const { error: templatesError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS email_templates (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            template_key VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            subject TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (templatesError) {
        // Try direct table creation
        const { error: directError } = await supabaseAdmin
          .from('email_templates')
          .select('*')
          .limit(1);

        if (directError && directError.code === '42P01') {
          return NextResponse.json({
            success: false,
            error: 'Cannot create tables. Please create them manually in Supabase Dashboard.',
            sql: `
              -- Run this in Supabase SQL Editor:
              CREATE TABLE email_templates (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                template_key VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                subject TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );

              CREATE TABLE email_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                action VARCHAR(50) NOT NULL,
                template_key VARCHAR(50),
                recipients_count INTEGER DEFAULT 0,
                successful_sends INTEGER DEFAULT 0,
                failed_sends INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );

              CREATE INDEX idx_email_templates_template_key ON email_templates(template_key);
              CREATE INDEX idx_email_logs_created_at ON email_logs(created_at);
            `
          }, { status: 500 });
        }
      }

      // Insert default templates
      const defaultTemplates = [
        {
          template_key: 'booking_confirmation',
          name: 'Booking Confirmation',
          subject: '🎉 Your Coaching Session is Confirmed - {customerName}',
          content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
  <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Session Confirmed!</h1>
    <p style="color: #fed7aa; margin: 10px 0 0 0; font-size: 16px;">Get ready for your coaching session</p>
  </div>
  <div style="padding: 40px 20px;">
    <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">Hi {customerName},</p>
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">Great news! Your coaching session has been confirmed.</p>
    <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 30px; margin: 30px 0;">
      <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">📅 Session Details</h3>
      <div><strong>Date:</strong> {sessionDate}</div>
      <div><strong>Time:</strong> {sessionTime}</div>
      <div><strong>Service:</strong> {productName}</div>
    </div>
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">Looking forward to working with you!</p>
  </div>
</div>`
        }
      ];

      const { error: insertError } = await supabaseAdmin
        .from('email_templates')
        .upsert(defaultTemplates, { onConflict: 'template_key' });

      if (insertError) {
        console.error('Error inserting default templates:', insertError);
      }

      return NextResponse.json({
        success: true,
        message: 'Email tables created and default templates added'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { success: false, error: 'Setup failed' },
      { status: 500 }
    );
  }
}

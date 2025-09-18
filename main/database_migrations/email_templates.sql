-- Create email templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email logs table for tracking sent emails
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(50) NOT NULL,
    template_key VARCHAR(50),
    recipients_count INTEGER DEFAULT 0,
    successful_sends INTEGER DEFAULT 0,
    failed_sends INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default templates
INSERT INTO email_templates (template_key, name, subject, content) VALUES
(
    'booking_confirmation',
    'Booking Confirmation',
    '🎉 Your Coaching Session is Confirmed - {customerName}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
  <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Session Confirmed!</h1>
    <p style="color: #fed7aa; margin: 10px 0 0 0; font-size: 16px;">Get ready for your coaching session</p>
  </div>
  
  <div style="padding: 40px 20px;">
    <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
      Hi {customerName},
    </p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Great news! Your coaching session has been confirmed. Here are your booking details:
    </p>
    
    <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 30px; margin: 30px 0;">
      <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">📅 Session Details</h3>
      <div style="display: grid; gap: 15px;">
        <div><strong>Date:</strong> {sessionDate}</div>
        <div><strong>Time:</strong> {sessionTime}</div>
        <div><strong>Service:</strong> {productName}</div>
        <div><strong>Duration:</strong> {duration} minutes</div>
      </div>
    </div>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      I''m excited to work with you! If you have any questions or need to reschedule, please don''t hesitate to reach out.
    </p>
  </div>
</div>'
),
(
    'booking_reminder',
    'Session Reminder',
    '⏰ Reminder: Your coaching session is tomorrow - {customerName}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Session Reminder</h1>
    <p style="color: #bfdbfe; margin: 10px 0 0 0; font-size: 16px;">Your coaching session is coming up!</p>
  </div>
  
  <div style="padding: 40px 20px;">
    <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
      Hi {customerName},
    </p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      This is a friendly reminder that your coaching session is scheduled for tomorrow. Here are the details:
    </p>
    
    <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 30px; margin: 30px 0;">
      <h3 style="color: #92400e; margin: 0 0 20px 0; font-size: 20px;">📅 Tomorrow''s Session</h3>
      <div style="display: grid; gap: 15px;">
        <div><strong>Date:</strong> {sessionDate}</div>
        <div><strong>Time:</strong> {sessionTime}</div>
        <div><strong>Service:</strong> {productName}</div>
      </div>
    </div>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Looking forward to our session! See you tomorrow.
    </p>
  </div>
</div>'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_templates_template_key ON email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_key ON email_logs(template_key);

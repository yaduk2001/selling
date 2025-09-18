-- Email Templates and Logs System Tables
-- Execute these commands in the Supabase SQL editor

-- 1. Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  html_content TEXT NOT NULL,
  plain_text_content TEXT,
  template_type VARCHAR(100) DEFAULT 'custom',
  placeholders JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  status VARCHAR(50) DEFAULT 'sent',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- 3. Create business_hours table
CREATE TABLE IF NOT EXISTS business_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_working_day BOOLEAN DEFAULT true,
  start_time TIME NOT NULL DEFAULT '09:00:00',
  end_time TIME NOT NULL DEFAULT '17:00:00',
  breaks JSONB DEFAULT '[]',
  timezone VARCHAR(100) DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(day_of_week)
);

-- 4. Create holidays table
CREATE TABLE IF NOT EXISTS holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date)
);

-- 5. Insert default business hours (Monday to Friday 9-5, weekends off)
INSERT INTO business_hours (day_of_week, is_working_day, start_time, end_time) VALUES
(1, true, '09:00:00', '17:00:00'),  -- Monday
(2, true, '09:00:00', '17:00:00'),  -- Tuesday
(3, true, '09:00:00', '17:00:00'),  -- Wednesday
(4, true, '09:00:00', '17:00:00'),  -- Thursday
(5, true, '09:00:00', '17:00:00'),  -- Friday
(0, false, '09:00:00', '17:00:00'), -- Sunday
(6, false, '09:00:00', '17:00:00')  -- Saturday
ON CONFLICT (day_of_week) DO NOTHING;

-- 6. Insert default email templates
INSERT INTO email_templates (name, subject, html_content, template_type, placeholders) VALUES
('Booking Confirmation', 'Booking Confirmed - {{booking_date}}', 
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1f2937; color: white; padding: 20px; border-radius: 8px;">
    <h2 style="color: #f97316; margin-bottom: 20px;">✅ Booking Confirmed</h2>
    <p>Dear {{customer_name}},</p>
    <p>Your booking has been confirmed for <strong>{{booking_date}}</strong> at <strong>{{booking_time}}</strong>.</p>
    <div style="background: #374151; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p><strong>Service:</strong> {{service_name}}</p>
      <p><strong>Duration:</strong> {{duration}}</p>
      <p><strong>Location:</strong> {{location}}</p>
    </div>
    <p>Thank you for choosing our services. We look forward to seeing you!</p>
    <hr style="border: none; border-top: 1px solid #4b5563; margin: 20px 0;">
    <p style="color: #9ca3af; font-size: 14px;">This is an automated message. Please do not reply.</p>
  </div>', 
 'booking', '{"customer_name": "Customer Name", "booking_date": "Date", "booking_time": "Time", "service_name": "Service", "duration": "Duration", "location": "Location"}'),

('Booking Cancellation', 'Booking Cancelled - {{booking_date}}', 
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1f2937; color: white; padding: 20px; border-radius: 8px;">
    <h2 style="color: #ef4444; margin-bottom: 20px;">❌ Booking Cancelled</h2>
    <p>Dear {{customer_name}},</p>
    <p>Your booking for <strong>{{booking_date}}</strong> at <strong>{{booking_time}}</strong> has been cancelled.</p>
    <div style="background: #374151; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p><strong>Cancelled Service:</strong> {{service_name}}</p>
      <p><strong>Reason:</strong> {{cancellation_reason}}</p>
    </div>
    <p>If you have any questions or would like to reschedule, please contact our support team.</p>
    <hr style="border: none; border-top: 1px solid #4b5563; margin: 20px 0;">
    <p style="color: #9ca3af; font-size: 14px;">This is an automated message. Please do not reply.</p>
  </div>', 
 'booking', '{"customer_name": "Customer Name", "booking_date": "Date", "booking_time": "Time", "service_name": "Service", "cancellation_reason": "Reason"}'),

('Welcome Email', 'Welcome to Our Service! 🎉', 
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1f2937; color: white; padding: 20px; border-radius: 8px;">
    <h2 style="color: #f97316; margin-bottom: 20px;">🎉 Welcome to Our Service!</h2>
    <p>Dear {{customer_name}},</p>
    <p>Welcome to our service! We are excited to have you on board.</p>
    <div style="background: #374151; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p>Here are some things you can do:</p>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Browse our available services</li>
        <li>Book your first appointment</li>
        <li>Manage your bookings</li>
        <li>Update your profile</li>
      </ul>
    </div>
    <p>If you need any help getting started, our support team is here to assist you.</p>
    <hr style="border: none; border-top: 1px solid #4b5563; margin: 20px 0;">
    <p style="color: #9ca3af; font-size: 14px;">This is an automated message. Please do not reply.</p>
  </div>', 
 'welcome', '{"customer_name": "Customer Name"}'),

('Account Suspended', 'Account Suspended - Action Required', 
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1f2937; color: white; padding: 20px; border-radius: 8px;">
    <h2 style="color: #ef4444; margin-bottom: 20px;">⚠️ Account Suspended</h2>
    <p>Dear {{customer_name}},</p>
    <p>Your account has been temporarily suspended.</p>
    <div style="background: #374151; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p><strong>Suspension Duration:</strong> {{duration}}</p>
      <p><strong>Reason:</strong> {{reason}}</p>
      <p><strong>Suspension Ends:</strong> {{end_date}}</p>
    </div>
    <p>If you believe this was done in error or have any questions, please contact our support team.</p>
    <hr style="border: none; border-top: 1px solid #4b5563; margin: 20px 0;">
    <p style="color: #9ca3af; font-size: 14px;">This is an automated message. Please do not reply.</p>
  </div>', 
 'user_management', '{"customer_name": "Customer Name", "duration": "Duration", "reason": "Reason", "end_date": "End Date"}')
ON CONFLICT DO NOTHING;

-- 7. Enable Row Level Security (RLS) policies if needed
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_template ON email_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_business_hours_day ON business_hours(day_of_week);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);

-- Done! Your database is now ready for the enhanced admin dashboard features.

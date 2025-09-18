import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { action } = await request.json();

    if (action === 'setup-tables') {
      const results = [];

      // Check and create email_templates table structure
      try {
        // Try to select from email_templates to see if it exists
        const { error: checkError } = await supabaseAdmin
          .from('email_templates')
          .select('id')
          .limit(1);

        if (checkError && checkError.code === 'PGRST116') {
          results.push({ table: 'email_templates', status: 'Table does not exist - needs manual creation' });
        } else {
          results.push({ table: 'email_templates', status: 'Table exists' });
        }
      } catch (error) {
        results.push({ table: 'email_templates', status: 'Error checking table: ' + error.message });
      }

      // Check business_hours table
      try {
        const { error: checkError } = await supabaseAdmin
          .from('business_hours')
          .select('id')
          .limit(1);

        if (checkError && checkError.code === 'PGRST116') {
          results.push({ table: 'business_hours', status: 'Table does not exist - needs manual creation' });
        } else {
          results.push({ table: 'business_hours', status: 'Table exists' });
        }
      } catch (error) {
        results.push({ table: 'business_hours', status: 'Error checking table: ' + error.message });
      }

      // Check holidays table
      try {
        const { error: checkError } = await supabaseAdmin
          .from('holidays')
          .select('id')
          .limit(1);

        if (checkError && checkError.code === 'PGRST116') {
          results.push({ table: 'holidays', status: 'Table does not exist - needs manual creation' });
        } else {
          results.push({ table: 'holidays', status: 'Table exists' });
        }
      } catch (error) {
        results.push({ table: 'holidays', status: 'Error checking table: ' + error.message });
      }

      // Check email_logs table
      try {
        const { error: checkError } = await supabaseAdmin
          .from('email_logs')
          .select('id')
          .limit(1);

        if (checkError && checkError.code === 'PGRST116') {
          results.push({ table: 'email_logs', status: 'Table does not exist - needs manual creation' });
        } else {
          results.push({ table: 'email_logs', status: 'Table exists' });
        }
      } catch (error) {
        results.push({ table: 'email_logs', status: 'Error checking table: ' + error.message });
      }

      return NextResponse.json({
        success: true,
        message: 'Database table check completed. Manual table creation may be required.',
        results,
        sql_commands: {
          email_templates: `
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
          `,
          email_logs: `
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
          `,
          business_hours: `
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
          `,
          holidays: `
            CREATE TABLE IF NOT EXISTS holidays (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              date DATE NOT NULL,
              is_recurring BOOLEAN DEFAULT false,
              description TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              UNIQUE(date)
            );
          `,
          default_business_hours: `
            INSERT INTO business_hours (day_of_week, is_working_day, start_time, end_time) VALUES
            (1, true, '09:00:00', '17:00:00'),
            (2, true, '09:00:00', '17:00:00'),
            (3, true, '09:00:00', '17:00:00'),
            (4, true, '09:00:00', '17:00:00'),
            (5, true, '09:00:00', '17:00:00'),
            (0, false, '09:00:00', '17:00:00'),
            (6, false, '09:00:00', '17:00:00')
            ON CONFLICT (day_of_week) DO NOTHING;
          `
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('Error in database setup:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

// Get database status
export async function GET() {
  try {
    // Check if tables exist
    const tables = ['email_templates', 'email_logs', 'business_hours', 'holidays'];
    const tableStatus = {};

    for (const table of tables) {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('id')
        .limit(1);

      tableStatus[table] = {
        exists: !error,
        error: error?.message || null
      };
    }

    return NextResponse.json({
      success: true,
      tableStatus,
      message: 'Database status retrieved successfully'
    });

  } catch (error) {
    console.error('Error checking database status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check database status'
    }, { status: 500 });
  }
}

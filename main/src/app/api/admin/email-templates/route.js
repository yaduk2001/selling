import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching email templates:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch templates' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      templates: data || []
    });

  } catch (error) {
    console.error('Error in email templates API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const template = await request.json();

    if (!template || !template.template_key) {
      return NextResponse.json(
        { success: false, error: 'Template data is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('email_templates')
      .update({
        name: template.name,
        subject: template.subject,
        content: template.content,
        updated_at: new Date().toISOString()
      })
      .eq('template_key', template.template_key);

    if (error) {
      console.error('Error updating email template:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update template' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Template updated successfully'
    });

  } catch (error) {
    console.error('Error in email templates update API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { templates } = await request.json();

    if (!templates) {
      return NextResponse.json(
        { success: false, error: 'Templates data is required' },
        { status: 400 }
      );
    }

    // Convert templates object to array format for storage
    const templateArray = Object.entries(templates).map(([key, template]) => ({
      template_key: key,
      name: template.name,
      subject: template.subject,
      content: template.content,
      updated_at: new Date().toISOString()
    }));

    // Use upsert to insert or update templates
    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .upsert(templateArray, { 
        onConflict: 'template_key',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('Error saving email templates:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to save templates' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      saved: data?.length || 0,
      templates: data
    });

  } catch (error) {
    console.error('Error in email templates save API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

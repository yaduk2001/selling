import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    // Get all social media links from site_content table
    const { data: socialContent, error } = await supabaseAdmin
      .from('site_content')
      .select('*')
      .eq('section', 'social_links')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching social links:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch social links'
      }, { status: 500 });
    }

    // If no social content exists, return default structure
    const defaultSocials = {
      youtube: 'https://youtube.com/@sellinginfinity?si=BOhyRQ-PfeRLEtUo',
      instagram: 'https://www.instagram.com/sellinginfinity',
      tiktok: 'https://www.tiktok.com/@sellinginfinity',
      threads: 'https://www.threads.com/@sellinginfinity',
      twitter: '',
      linkedin: '',
      facebook: ''
    };

    const socials = socialContent?.metadata || defaultSocials;

    return NextResponse.json({
      success: true,
      socials
    });

  } catch (error) {
    console.error('Error in admin social links API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { socials } = await request.json();

    if (!socials) {
      return NextResponse.json({
        success: false,
        error: 'Social links data required'
      }, { status: 400 });
    }

    // Update or create social links in site_content table
    const { data, error } = await supabaseAdmin
      .from('site_content')
      .upsert({
        section: 'social_links',
        title: 'Social Media Links',
        metadata: socials,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'section'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating social links:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update social links'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      socials: data.metadata
    });

  } catch (error) {
    console.error('Error in admin social links POST:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

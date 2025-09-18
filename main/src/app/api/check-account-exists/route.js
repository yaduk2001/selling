// API to check if user account exists for email
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Check if profile exists with this email
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    const exists = !error && profile;

    return NextResponse.json({
      exists: exists,
      email: email
    });

  } catch (error) {
    console.error('Error checking account:', error);
    return NextResponse.json({ 
      exists: false,
      error: 'Could not check account existence'
    }, { status: 500 });
  }
}

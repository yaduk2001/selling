import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    // Get user email from request body
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, isAdmin: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user has admin privileges
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { success: false, isAdmin: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Check admin status using multiple methods
    let isAdmin = false;
    
    // Method 1: Check is_admin field (if it exists)
    if (profile.is_admin === true) {
      isAdmin = true;
    }
    
    // Method 2: Check role field (if it exists)
    if (profile.role === 'admin') {
      isAdmin = true;
    }
    
    // Method 3: Check company field for admin indicator
    if (profile.company === 'ADMIN_USER') {
      isAdmin = true;
    }

    return NextResponse.json({
      success: true,
      isAdmin: isAdmin,
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name
      },
      adminMethod: isAdmin ? (
        profile.is_admin ? 'is_admin field' :
        profile.role === 'admin' ? 'role field' :
        profile.company === 'ADMIN_USER' ? 'company field' : 'unknown'
      ) : 'none'
    });

  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json(
      { success: false, isAdmin: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

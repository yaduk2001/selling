import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { name, email, phone, address } = await request.json();

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    // Update user in auth.users metadata
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: {
        name: name,
        full_name: name,
        phone: phone,
        address: address
      }
    });

    if (authError) {
      console.error('Error updating auth user:', authError);
    }

    // Also update in profiles table if it exists
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: id,
        name: name,
        full_name: name,
        email: email,
        phone: phone,
        address: address,
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Error in user update:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

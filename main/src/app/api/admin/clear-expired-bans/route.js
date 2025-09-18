import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    // Get all users with banned_until set
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch users: ' + authError.message
      }, { status: 500 });
    }

    const now = new Date();
    let clearedCount = 0;
    let errorCount = 0;

    // Check each user and clear expired bans
    for (const user of authUsers.users) {
      if (user.banned_until) {
        const bannedUntil = new Date(user.banned_until);
        
        // If the ban has expired, clear it
        if (bannedUntil <= now) {
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
            banned_until: null
          });

          if (updateError) {
            console.error(`Error clearing expired ban for user ${user.id}:`, updateError);
            errorCount++;
          } else {
            clearedCount++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleared ${clearedCount} expired bans${errorCount > 0 ? ` (${errorCount} errors)` : ''}`,
      clearedCount,
      errorCount
    });

  } catch (error) {
    console.error('Error in clear expired bans API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

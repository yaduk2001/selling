import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    // Get all users from auth
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch users: ' + authError.message
      }, { status: 500 });
    }

    // Group users by email
    const emailGroups = new Map();
    
    authUsers.users.forEach(user => {
      if (!emailGroups.has(user.email)) {
        emailGroups.set(user.email, []);
      }
      emailGroups.get(user.email).push(user);
    });

    // Find and process duplicates
    const duplicateEmails = Array.from(emailGroups.entries()).filter(([email, users]) => users.length > 1);
    
    if (duplicateEmails.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No duplicate users found',
        duplicatesRemoved: 0
      });
    }

    let removedCount = 0;
    const summary = [];

    for (const [email, users] of duplicateEmails) {
      // Sort users by creation date (newest first)
      users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      // Keep the newest user, remove others
      const userToKeep = users[0];
      const usersToRemove = users.slice(1);

      for (const userToRemove of usersToRemove) {
        try {
          // Before deleting, check if this user has any important data
          const { data: bookings } = await supabaseAdmin
            .from('bookings')
            .select('id')
            .eq('email', email);

          const { data: transactions } = await supabaseAdmin
            .from('transactions')
            .select('id')
            .eq('customer_email', email);

          // If the user to remove has bookings/transactions, we might want to keep it
          const hasImportantData = (bookings?.length > 0) || (transactions?.length > 0);
          
          if (hasImportantData) {
            // Check if the user we're keeping also has this data
            // If not, we should keep the one with data instead
            summary.push({
              email,
              action: 'skipped',
              reason: 'User has booking/transaction data',
              userId: userToRemove.id
            });
            continue;
          }

          // Safe to delete this duplicate
          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userToRemove.id);
          
          if (deleteError) {
            console.error(`Failed to delete user ${userToRemove.id}:`, deleteError);
            summary.push({
              email,
              action: 'failed',
              reason: deleteError.message,
              userId: userToRemove.id
            });
          } else {
            removedCount++;
            summary.push({
              email,
              action: 'removed',
              reason: 'Duplicate user removed',
              userId: userToRemove.id,
              keptUser: userToKeep.id
            });
          }
        } catch (error) {
          console.error(`Error processing user ${userToRemove.id}:`, error);
          summary.push({
            email,
            action: 'error',
            reason: error.message,
            userId: userToRemove.id
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleanup completed. Removed ${removedCount} duplicate users.`,
      duplicatesRemoved: removedCount,
      summary
    });

  } catch (error) {
    console.error('Error in cleanup duplicates:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

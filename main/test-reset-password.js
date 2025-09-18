#!/usr/bin/env node

/**
 * Test script for debugging password reset functionality
 * This script helps identify issues with the reset password flow
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testResetPassword() {
  console.log('🔧 Testing Password Reset Flow...\n');

  // Test 1: Check Supabase connection
  console.log('1. Testing Supabase connection...');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('❌ Supabase connection error:', error.message);
      return;
    }
    console.log('✅ Supabase connection successful');
  } catch (err) {
    console.log('❌ Supabase connection failed:', err.message);
    return;
  }

  // Test 2: Check environment variables
  console.log('\n2. Checking environment variables...');
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar}: Set`);
    } else {
      console.log(`❌ ${envVar}: Missing`);
    }
  }

  // Test 3: Test reset password API
  console.log('\n3. Testing reset password API...');
  console.log('Note: This will send an actual email if configured correctly');
  
  const testEmail = 'test@example.com'; // Change this to a real email for testing
  console.log(`Testing with email: ${testEmail}`);
  console.log('⚠️  To actually test, change the email above to a real email address');

  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: 'http://localhost:3000/auth/reset-password'
    });

    if (error) {
      console.log('❌ Reset password error:', error.message);
      
      // Common error analysis
      if (error.message.includes('Email not confirmed')) {
        console.log('💡 Tip: The user email might not be confirmed yet');
      } else if (error.message.includes('rate limit')) {
        console.log('💡 Tip: Rate limit reached, wait before trying again');
      } else if (error.message.includes('not found')) {
        console.log('💡 Tip: Email address not found in database');
      }
    } else {
      console.log('✅ Reset password email would be sent successfully');
      console.log('Data:', data);
    }
  } catch (err) {
    console.log('❌ Reset password failed:', err.message);
  }

  // Test 4: Check auth configuration
  console.log('\n4. Checking Supabase Auth Configuration...');
  console.log('Please verify in your Supabase dashboard:');
  console.log('- Auth > Settings > Site URL includes your domain');
  console.log('- Auth > Settings > Redirect URLs includes:');
  console.log('  * http://localhost:3000/auth/callback');
  console.log('  * http://localhost:3000/auth/reset-password');
  console.log('  * https://yourdomain.com/auth/callback');
  console.log('  * https://yourdomain.com/auth/reset-password');
  console.log('- Auth > Email Templates > Reset Password is configured');
  console.log('- SMTP settings are configured for email delivery');

  console.log('\n📋 Common Issues and Solutions:');
  console.log('1. Email not received:');
  console.log('   - Check SMTP configuration in Supabase');
  console.log('   - Check spam folder');
  console.log('   - Verify email template is enabled');
  
  console.log('\n2. Invalid reset link:');
  console.log('   - Check redirect URLs in Supabase Auth settings');
  console.log('   - Ensure callback route handles recovery type');
  console.log('   - Verify reset-password page handles tokens correctly');
  
  console.log('\n3. Password update fails:');
  console.log('   - Ensure user session is valid during reset');
  console.log('   - Check password requirements');
  console.log('   - Verify updateUser permissions');

  console.log('\n✅ Test completed!');
}

// Run the test
testResetPassword().catch(console.error);

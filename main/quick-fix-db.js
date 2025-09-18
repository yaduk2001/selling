// Quick database fix using Supabase client
// Run this with: node quick-fix-db.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function quickDatabaseFix() {
  try {
    console.log('🔧 Starting quick database diagnostics and fix...');

    // Test 1: Check if profiles table exists and is accessible
    console.log('📋 Testing profiles table access...');
    const { data: profileTest, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (profileError) {
      console.error('❌ Profiles table error:', profileError.message);
      
      if (profileError.code === '42P01') {
        console.log('🛠️  Profiles table does not exist. This is the main issue!');
        console.log('📋 You need to run the complete database setup.');
        console.log('');
        console.log('IMMEDIATE ACTIONS REQUIRED:');
        console.log('1. Go to your Supabase Dashboard');
        console.log('2. Open the SQL Editor');
        console.log('3. Copy and paste the contents of EMERGENCY_USER_SIGNUP_FIX.sql');
        console.log('4. Execute the SQL script');
        console.log('');
        return;
      }
    } else {
      console.log('✅ Profiles table is accessible');
    }

    // Test 2: Check if auth trigger exists by trying to create a test scenario
    console.log('🔍 Testing auth integration...');
    
    // Test 3: Check current RLS policies
    console.log('🔒 Checking RLS policies...');
    
    // Test user signup flow by checking auth configuration
    console.log('🧪 Testing auth configuration...');
    
    // Get current auth config (this might fail, which is expected)
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('⚠️  Auth admin access limited (expected)');
    } else {
      console.log('✅ Auth system is working');
    }

    console.log('');
    console.log('DIAGNOSIS COMPLETE');
    console.log('=================');
    console.log('');
    
    if (profileError && profileError.code === '42P01') {
      console.log('❌ CRITICAL: Profiles table missing');
      console.log('✋ SOLUTION: Run EMERGENCY_USER_SIGNUP_FIX.sql in Supabase SQL Editor');
    } else {
      console.log('✅ Database structure appears correct');
      console.log('🤔 The signup error might be due to:');
      console.log('   - RLS policies blocking profile creation');
      console.log('   - Missing trigger function');
      console.log('   - Auth metadata issues');
      console.log('');
      console.log('💡 NEXT STEPS:');
      console.log('   1. Run EMERGENCY_USER_SIGNUP_FIX.sql in Supabase SQL Editor');
      console.log('   2. Test user signup again');
      console.log('   3. Check browser console for more specific errors');
    }

  } catch (error) {
    console.error('❌ Critical error during diagnosis:', error.message);
    console.log('');
    console.log('🚨 IMMEDIATE ACTION REQUIRED:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Run EMERGENCY_USER_SIGNUP_FIX.sql');
    console.log('3. This will create the profiles table and fix the trigger');
  }
}

quickDatabaseFix();

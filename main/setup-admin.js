#!/usr/bin/env node

// Admin Setup Script for Selling Infinity
// Run with: node setup-admin.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config({ path: '.env.local' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔐 Selling Infinity Admin Setup\n');

// Check if environment variables are set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('❌ Missing Supabase environment variables!');
  console.log('Please ensure .env.local contains:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY\n');
  process.exit(1);
}

async function setupAdmin() {
  try {
    console.log('📋 Current Admin Users:');
    
    // Check existing admin users
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('*');
    
    if (adminError) {
      console.log('⚠️  Admin users table not found. Creating it...');
      
      // Create admin_users table if it doesn't exist
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS admin_users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT NOT NULL UNIQUE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      });
      
      if (createError) {
        console.log('❌ Could not create admin_users table automatically.');
        console.log('Please create it manually in Supabase SQL Editor:\n');
        console.log(`
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
        `);
        return;
      }
    }
    
    if (adminUsers && adminUsers.length > 0) {
      console.log('✅ Existing admin users:');
      adminUsers.forEach(admin => {
        console.log(`   - ${admin.email} (ID: ${admin.user_id})`);
      });
    } else {
      console.log('❌ No admin users found.');
    }
    
    console.log('\n📧 Available Users (from auth.users):');
    
    // Get all users from auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Error fetching users:', authError.message);
      return;
    }
    
    if (authUsers.users.length === 0) {
      console.log('❌ No users found. Please create a user account first:');
      console.log('1. Go to your website signup page');
      console.log('2. Create an account with your desired admin email');
      console.log('3. Run this script again\n');
      return;
    }
    
    console.log('Available users:');
    authUsers.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (Created: ${new Date(user.created_at).toLocaleDateString()})`);
    });
    
    // Ask user to select which user should be admin
    const question = (query) => new Promise((resolve) => rl.question(query, resolve));
    
    const userChoice = await question('\nEnter the number of the user you want to make admin (or press Enter to skip): ');
    
    if (userChoice && !isNaN(userChoice) && userChoice > 0 && userChoice <= authUsers.users.length) {
      const selectedUser = authUsers.users[userChoice - 1];
      
      console.log(`\n🔐 Making ${selectedUser.email} an admin...`);
      
      // Add user to admin_users table
      const { data: newAdmin, error: insertError } = await supabase
        .from('admin_users')
        .insert({
          user_id: selectedUser.id,
          email: selectedUser.email
        })
        .select();
      
      if (insertError) {
        if (insertError.code === '23505') {
          console.log('✅ User is already an admin!');
        } else {
          console.log('❌ Error adding admin:', insertError.message);
        }
      } else {
        console.log('✅ Successfully added admin user!');
        console.log(`   Email: ${selectedUser.email}`);
        console.log(`   User ID: ${selectedUser.id}`);
      }
    }
    
    console.log('\n🎯 Admin Login Instructions:');
    console.log('1. Go to: http://localhost:3000/admin/login');
    console.log('2. Use the email and password of the user you just made admin');
    console.log('3. You will be redirected to the admin dashboard\n');
    
    console.log('📋 Admin Dashboard Features:');
    console.log('✅ User Management');
    console.log('✅ Booking Management');
    console.log('✅ Calendar Management');
    console.log('✅ Email Templates');
    console.log('✅ Business Hours');
    console.log('✅ Statistics & Reports\n');
    
  } catch (error) {
    console.error('❌ Setup error:', error.message);
  } finally {
    rl.close();
  }
}

setupAdmin();

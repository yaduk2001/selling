#!/usr/bin/env node

// Email Setup Script for Selling Infinity
// Run with: node setup-email.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📧 Selling Infinity Email Setup\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('❌ .env.local file not found!');
  console.log('\n📝 Creating .env.local template...\n');
  
  const envTemplate = `# Selling Infinity Environment Variables
# Email Configuration (Choose ONE option)

# Option 1: Resend (Recommended - Easiest Setup)
# Sign up at https://resend.com and get your API key
RESEND_API_KEY=

# Option 2: Gmail SMTP (Alternative - Free but requires 2FA setup)
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASS=your-16-digit-app-password

# Your existing Supabase variables
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Your existing Stripe variables
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxx
`;

  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Created .env.local template');
  console.log('📝 Please edit .env.local and add your email service credentials\n');
} else {
  console.log('✅ .env.local file exists');
  
  // Read and check current configuration
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const hasResend = envContent.includes('RESEND_API_KEY=') && 
                   !envContent.includes('RESEND_API_KEY=\n') && 
                   !envContent.includes('RESEND_API_KEY=\r\n');
  
  const hasGmail = envContent.includes('EMAIL_USER=') && 
                  !envContent.includes('EMAIL_USER=your-email@gmail.com');
  
  console.log('📧 Email Service Status:');
  console.log(`   Resend API Key: ${hasResend ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   Gmail SMTP: ${hasGmail ? '✅ Configured' : '❌ Not configured'}`);
  
  if (!hasResend && !hasGmail) {
    console.log('\n⚠️  No email service configured!');
    console.log('📝 Please add either RESEND_API_KEY or EMAIL_USER/EMAIL_PASS to .env.local\n');
  }
}

console.log('🚀 Quick Setup Options:\n');

console.log('Option 1: Resend (Recommended - 5 minutes)');
console.log('1. Go to https://resend.com');
console.log('2. Sign up for free account');
console.log('3. Get your API key from dashboard');
console.log('4. Add to .env.local: RESEND_API_KEY=re_xxxxxxxxxx\n');

console.log('Option 2: Gmail SMTP (Free but requires setup)');
console.log('1. Enable 2FA on your Gmail account');
console.log('2. Generate App Password: https://myaccount.google.com/apppasswords');
console.log('3. Add to .env.local:');
console.log('   EMAIL_USER=your-email@gmail.com');
console.log('   EMAIL_PASS=your-16-digit-app-password\n');

console.log('🧪 After configuration, test with:');
console.log('   npm run test-email\n');

console.log('📚 For detailed instructions, see: EMAIL_SETUP_COMPLETE_GUIDE.md');

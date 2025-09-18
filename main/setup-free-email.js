#!/usr/bin/env node

// 🆓 FREE Email Setup Script for Selling Infinity
// Run with: node setup-free-email.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🆓 Selling Infinity FREE Email Setup\n');
console.log('This will help you set up FREE email sending using Gmail SMTP\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('❌ .env.local file not found!');
  console.log('\n📝 Creating .env.local template...\n');
  
  const envTemplate = `# Selling Infinity Environment Variables
# 🆓 FREE Gmail SMTP Configuration (No API Keys Required!)

# Gmail SMTP Configuration
# 1. Enable 2FA: https://myaccount.google.com/security
# 2. Generate App Password: https://myaccount.google.com/apppasswords
# 3. Use the 16-digit App Password below (NOT your regular password)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-digit-app-password

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
  console.log('📝 Please edit .env.local and add your Gmail credentials\n');
} else {
  console.log('✅ .env.local file exists');
  
  // Read and check current configuration
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const hasEmailUser = envContent.includes('EMAIL_USER=') && 
                      !envContent.includes('EMAIL_USER=your-email@gmail.com');
  
  const hasEmailPass = envContent.includes('EMAIL_PASS=') && 
                      !envContent.includes('EMAIL_PASS=your-16-digit-app-password');
  
  console.log('📧 Gmail SMTP Status:');
  console.log(`   EMAIL_USER: ${hasEmailUser ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   EMAIL_PASS: ${hasEmailPass ? '✅ Configured' : '❌ Not configured'}`);
  
  if (!hasEmailUser || !hasEmailPass) {
    console.log('\n⚠️  Gmail SMTP not fully configured!');
    console.log('📝 Please add EMAIL_USER and EMAIL_PASS to .env.local\n');
  } else {
    console.log('\n🎉 Gmail SMTP is configured! You can now send emails for FREE!\n');
  }
}

console.log('🆓 FREE Gmail SMTP Setup Instructions:\n');

console.log('Step 1: Enable 2-Factor Authentication');
console.log('1. Go to: https://myaccount.google.com/security');
console.log('2. Click "2-Step Verification"');
console.log('3. Follow the setup process (you\'ll need your phone)\n');

console.log('Step 2: Generate App Password');
console.log('1. Go to: https://myaccount.google.com/apppasswords');
console.log('2. Select "Mail" as the app');
console.log('3. Select "Other" as device, name it "Selling Infinity"');
console.log('4. Click "Generate"');
console.log('5. Copy the 16-digit password (looks like: abcd efgh ijkl mnop)\n');

console.log('Step 3: Update .env.local');
console.log('1. Open .env.local in your project root');
console.log('2. Replace "your-email@gmail.com" with your actual Gmail address');
console.log('3. Replace "your-16-digit-app-password" with the App Password from Step 2\n');

console.log('Step 4: Test Your Setup');
console.log('Run: npm run test-email\n');

console.log('🎯 What You Get:');
console.log('✅ 100% FREE email sending (no API keys required)');
console.log('✅ Up to 500 emails per day');
console.log('✅ Professional email templates');
console.log('✅ High deliverability through Gmail');
console.log('✅ Works immediately after setup\n');

console.log('📚 For detailed instructions, see: FREE_EMAIL_SETUP_GUIDE.md');
console.log('🧪 Test your setup with: npm run test-email');

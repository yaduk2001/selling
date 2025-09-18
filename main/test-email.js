// 🆓 FREE Email Test Script - Gmail SMTP (No API Keys Required!)
// Usage: node test-email.js

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

console.log('🆓 FREE Email Configuration Test - Gmail SMTP\n');
console.log('📧 EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');
console.log('🔑 EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Missing');
console.log('');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.log('❌ Missing email credentials. Please set EMAIL_USER and EMAIL_PASS in your .env.local file');
  console.log('');
  console.log('🆓 FREE Gmail SMTP Setup (No API Keys Required!):');
  console.log('1. Enable 2-Factor Authentication: https://myaccount.google.com/security');
  console.log('2. Generate App Password: https://myaccount.google.com/apppasswords');
  console.log('3. Use the App Password (16 digits) as EMAIL_PASS, not your regular password');
  console.log('');
  console.log('📝 Example .env.local:');
  console.log('EMAIL_USER=your-email@gmail.com');
  console.log('EMAIL_PASS=abcd efgh ijkl mnop');
  console.log('');
  console.log('📚 For detailed instructions, see: FREE_EMAIL_SETUP_GUIDE.md');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function testEmailConfiguration() {
  console.log('🔍 Testing SMTP connection...');
  
  try {
    // Verify SMTP connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
  } catch (error) {
    console.log('❌ SMTP connection failed:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('💡 This usually means you need to use an App Password instead of your regular Gmail password');
      console.log('💡 Make sure 2FA is enabled and generate an App Password from: https://myaccount.google.com/apppasswords');
    }
    return false;
  }

  console.log('');
  console.log('📧 Sending test email...');
  
  try {
    const testEmail = process.env.EMAIL_USER; // Send to yourself for testing
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: testEmail,
      subject: '🧪 Test Email from Selling Infinity Admin System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Email Test Successful!</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <h2 style="color: #111827; margin-bottom: 20px;">Configuration Verified</h2>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Your email configuration is working correctly! The admin system can now send:
            </p>
            
            <ul style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0;">
              <li>✅ Booking confirmation emails</li>
              <li>✅ Booking rejection notifications</li>
              <li>✅ Booking cancellation notices</li>
              <li>✅ User account notifications</li>
              <li>✅ Admin email templates</li>
            </ul>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #d1d5db; margin: 20px 0;">
              <h3 style="color: #111827; margin-top: 0;">Test Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; width: 120px;"><strong>From:</strong></td>
                  <td style="padding: 8px 0; color: #111827;">${process.env.EMAIL_USER}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>To:</strong></td>
                  <td style="padding: 8px 0; color: #111827;">${testEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Time:</strong></td>
                  <td style="padding: 8px 0; color: #111827;">${new Date().toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Status:</strong></td>
                  <td style="padding: 8px 0; color: #059669;"><strong>SUCCESS</strong></td>
                </tr>
              </table>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Your Selling Infinity admin system is now ready to send automated emails to customers!
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px;">
            This is an automated test message from your admin system.
          </div>
        </div>
      `,
      text: `
Email Configuration Test Successful!

Your Selling Infinity admin system email configuration is working correctly.

Test Details:
- From: ${process.env.EMAIL_USER}
- To: ${testEmail}
- Time: ${new Date().toLocaleString()}
- Status: SUCCESS

The system can now send automated emails for bookings, user management, and admin notifications.
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('📨 Check your email inbox for the test message');
    console.log('');
    console.log('🎉 FREE Gmail SMTP configuration is working correctly!');
    console.log('🆓 Your admin system is ready to send automated emails - NO API KEYS REQUIRED!');
    console.log('📧 You can now send up to 500 emails per day for FREE!');
    
    return true;
  } catch (error) {
    console.log('❌ Failed to send test email:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('💡 Authentication failed. Double-check your EMAIL_USER and EMAIL_PASS');
      console.log('💡 For Gmail: Make sure you are using an App Password, not your regular password');
    } else if (error.code === 'ECONNECTION') {
      console.log('💡 Connection failed. Check your internet connection and firewall settings');
    }
    
    return false;
  }
}

// Run the test
testEmailConfiguration().then((success) => {
  if (success) {
    console.log('');
    console.log('✨ Next steps:');
    console.log('1. Test the enhanced user management system');
    console.log('2. Try booking confirmation/rejection from the admin dashboard');
    console.log('3. Send test emails using the email template manager');
    console.log('4. Check out your beautiful email templates in the admin dashboard');
    console.log('');
    console.log('🆓 You are now sending emails for FREE using Gmail SMTP!');
    console.log('🔒 Security reminder: Never commit your .env.local file to version control!');
  } else {
    console.log('');
    console.log('🔧 Please fix the email configuration and run this test again');
    console.log('📚 Check EMAIL_2FA_SETUP_GUIDE.md for detailed setup instructions');
  }
});

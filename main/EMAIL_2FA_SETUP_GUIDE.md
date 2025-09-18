# Email Setup Guide for 2FA Gmail Accounts

## Gmail with 2FA Authentication Setup

When your Gmail account has 2-Factor Authentication (2FA) enabled, you cannot use your regular Gmail password for SMTP authentication. Instead, you need to use **App Passwords**.

### Step 1: Generate App Password

1. **Go to Google Account Settings:**
   - Visit: https://myaccount.google.com/
   - Sign in with your Gmail account

2. **Navigate to Security:**
   - Click on "Security" in the left sidebar
   - Scroll down to "Signing in to Google"

3. **Enable 2-Step Verification (if not already enabled):**
   - Click on "2-Step Verification"
   - Follow the setup process if it's not already enabled
   - **Note: App passwords only work with 2FA enabled**

4. **Generate App Password:**
   - Go back to Security settings
   - Click on "App passwords" (this appears only after 2FA is enabled)
   - Select "Mail" as the app
   - Select "Other (custom name)" as the device
   - Enter a name like "Selling Infinity App"
   - Click "Generate"
   - **Copy the 16-character app password** (spaces don't matter)

### Step 2: Environment Variables Setup

Create or update your `.env.local` file with:

```bash
# Email Configuration (Gmail with 2FA)
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-digit-app-password
```

**Example:**
```bash
EMAIL_USER=admin@yourbusiness.com
EMAIL_PASS=abcd efgh ijkl mnop  # This is the app password, not your regular password
```

### Step 3: Alternative Email Services

If you prefer not to use Gmail, here are other options:

#### Option A: Gmail with Less Secure Apps (NOT RECOMMENDED - Deprecated by Google)
- This method is no longer supported by Google as of May 2022

#### Option B: Outlook/Hotmail
```javascript
const transporter = nodemailer.createTransporter({
  service: 'hotmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

#### Option C: Custom SMTP Server
```javascript
const transporter = nodemailer.createTransporter({
  host: 'your-smtp-server.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

#### Option D: SendGrid (Recommended for Production)
```bash
npm install @sendgrid/mail
```

```javascript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'recipient@example.com',
  from: 'sender@example.com',
  subject: 'Subject',
  text: 'Plain text content',
  html: '<p>HTML content</p>'
};

await sgMail.send(msg);
```

### Step 4: Testing Your Setup

Create a test file to verify your email configuration:

```javascript
// test-email.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function testEmail() {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'test@example.com', // Replace with your test email
      subject: 'Test Email from Selling Infinity',
      html: '<h1>Email configuration successful!</h1><p>Your email system is working correctly.</p>'
    });

    console.log('✅ Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    
    // Common error solutions:
    if (error.message.includes('Invalid login')) {
      console.log('💡 Solution: Make sure you\'re using an App Password, not your regular Gmail password');
    }
    if (error.message.includes('Less secure app')) {
      console.log('💡 Solution: Enable 2FA and use App Passwords');
    }
  }
}

testEmail();
```

### Step 5: Security Best Practices

1. **Never commit email credentials to version control**
2. **Use environment variables for all sensitive data**
3. **Rotate app passwords periodically**
4. **Consider using dedicated email services like SendGrid for production**
5. **Monitor email delivery rates and bounce rates**

### Troubleshooting Common Issues

#### Error: "Invalid login: 535-5.7.8 Username and Password not accepted"
- **Solution**: Use App Password instead of regular password
- Ensure 2FA is enabled on your Google account

#### Error: "Less secure app access is disabled"
- **Solution**: This error occurs when trying to use regular password. Switch to App Passwords.

#### Error: "SMTP connection failed"
- **Solution**: Check firewall settings and network connectivity
- Verify SMTP server settings

#### App Password not working
- **Solution**: 
  - Ensure 2FA is enabled first
  - Regenerate the app password
  - Remove spaces from the app password (though they usually don't matter)

### Production Recommendations

For production environments, consider:

1. **SendGrid**: Professional email service with high deliverability
2. **Amazon SES**: Cost-effective for high volume
3. **Mailgun**: Developer-friendly with good APIs
4. **Postmark**: Focus on transactional emails

These services provide better deliverability, analytics, and don't rely on personal email accounts.

---

## Current Implementation Status

Your email system is configured to work with the following setup:

```javascript
// In your API routes
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,    // Your Gmail address
    pass: process.env.EMAIL_PASS,    // Your 16-digit App Password
  },
});
```

**Next Steps:**
1. Generate your Gmail App Password following the steps above
2. Add EMAIL_USER and EMAIL_PASS to your .env.local file
3. Test the email functionality using the enhanced user management system
4. Monitor email delivery and consider upgrading to a professional email service for production

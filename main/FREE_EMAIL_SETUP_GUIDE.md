# 🆓 FREE Email Setup Guide - No API Keys Required!

## 🎯 Overview
This guide shows you how to send emails using **Nodemailer + Gmail SMTP** completely **FREE** without any paid services or API keys. You just need a Gmail account with 2-Factor Authentication enabled.

## ✅ What You Get
- ✅ **100% FREE** email sending
- ✅ **No API keys** or paid services required
- ✅ **Professional email templates** from your admin dashboard
- ✅ **Unlimited emails** (within Gmail's daily limits)
- ✅ **High deliverability** through Gmail's servers
- ✅ **Works immediately** after setup

## 🚀 Quick Setup (5 Minutes)

### Step 1: Enable 2-Factor Authentication on Gmail
1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Click on **"2-Step Verification"**
3. Follow the setup process (you'll need your phone)

### Step 2: Generate App Password
1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Select **"Mail"** as the app
3. Select **"Other"** as the device and name it "Selling Infinity"
4. Click **"Generate"**
5. **Copy the 16-digit password** (it looks like: `abcd efgh ijkl mnop`)

### Step 3: Create Environment File
Create a file called `.env.local` in your project root with:

```bash
# FREE Gmail SMTP Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop

# Your existing variables (keep these)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-key
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxx
```

### Step 4: Test Your Setup
Run the test script:
```bash
npm run test-email
```

## 📧 How It Works

### Gmail SMTP Configuration
- **Server**: smtp.gmail.com
- **Port**: 587 (TLS) or 465 (SSL)
- **Authentication**: Your Gmail + App Password
- **Daily Limit**: 500 emails per day (free Gmail account)

### Email Templates Available
Your system includes these professional templates:

1. **📅 Booking Confirmation**
   - Beautiful gradient design
   - Session details with timezone support
   - Meeting link integration
   - Preparation tips

2. **⏰ Session Reminder**
   - 24-hour advance reminder
   - Session preparation checklist
   - Contact information

3. **❌ Booking Cancellation**
   - Professional cancellation notice
   - Refund information
   - Rescheduling options

4. **👋 Welcome Email**
   - New user onboarding
   - Account setup instructions
   - Service overview

## 🎨 Template Features

- **Responsive Design**: Works on all devices
- **Timezone Support**: Shows times in user's timezone
- **Dynamic Content**: Personalized with customer data
- **Professional Branding**: Matches your orange theme
- **Call-to-Action Buttons**: Direct links to manage bookings

## 🔧 Troubleshooting

### "Authentication failed" Error
- ✅ Make sure you're using the **App Password**, not your regular Gmail password
- ✅ Ensure 2FA is enabled on your Gmail account
- ✅ Remove any spaces from the App Password when copying

### "Connection failed" Error
- ✅ Check your internet connection
- ✅ Verify firewall settings allow SMTP connections
- ✅ Try again in a few minutes (Gmail may be temporarily unavailable)

### Templates Not Loading
- ✅ Check database connection
- ✅ Run the email table setup: `/api/admin/setup-email-tables`
- ✅ Verify Supabase service role key

## 📊 Gmail Limits (Free Account)

| Limit Type | Amount |
|------------|--------|
| **Daily sending limit** | 500 emails |
| **Recipients per email** | 500 recipients |
| **Attachment size** | 25MB |
| **Total storage** | 15GB (shared with Drive, Photos) |

## 🚀 Production Recommendations

### For Higher Volume (500+ emails/day):
1. **Gmail Workspace** ($6/month)
   - 2,000 emails/day
   - Custom domain support
   - Professional appearance

2. **SendGrid** (Free tier: 100 emails/day)
   - 100 emails/day free
   - Professional email service
   - Advanced analytics

3. **Amazon SES** (Very cheap)
   - $0.10 per 1,000 emails
   - Requires AWS setup
   - Best for high volume

## 🎯 Next Steps

1. **Set up Gmail 2FA** (if not already done)
2. **Generate App Password**
3. **Add credentials to `.env.local`**
4. **Test with `npm run test-email`**
5. **Verify templates in admin dashboard**
6. **Test booking confirmation flow**

## 💡 Pro Tips

- **App Passwords are safer** than using your regular password
- **Gmail SMTP is reliable** and has high deliverability
- **Templates automatically use user's timezone**
- **All emails include your branding**
- **Templates are fully customizable** in admin dashboard
- **Never commit `.env.local`** to version control

## 🔒 Security Notes

- ✅ **App Passwords are secure** - they can only send emails
- ✅ **2FA protects your account** even if App Password is compromised
- ✅ **Environment variables are safe** when not committed to git
- ✅ **Gmail SMTP uses encryption** for all connections

---

## 🎉 You're All Set!

Your email system is now configured to send professional emails **completely FREE** using Gmail SMTP. No API keys, no paid services, no monthly fees!

**Test it now:**
```bash
npm run test-email
```

**Then check your admin dashboard** to see all the beautiful email templates ready to use!

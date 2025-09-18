# 📧 Email Notifications Setup Guide

## ✅ **Fixed Issues & New Features**

I've fixed the email notification system and added new features for booking confirmations and session reminders.

### **🔧 Issues Fixed:**

1. **❌ Missing `type` variable** in admin notification API → ✅ **FIXED**
2. **❌ Missing `sendConfirmationEmail` function** in webhook → ✅ **IMPLEMENTED**
3. **❌ No automatic session reminders** → ✅ **CREATED**
4. **❌ Email service configuration issues** → ✅ **RESOLVED**

## 🎯 **New Features Added:**

### **1. Booking Confirmation Emails**
- ✅ **Automatic emails** sent when customers complete bookings
- ✅ **Professional templates** with session details
- ✅ **Admin notifications** when new bookings are made
- ✅ **Template customization** through admin dashboard

### **2. Session Reminder System**
- ✅ **Manual reminders** - Send from admin dashboard
- ✅ **Automatic reminders** - Cron job for daily reminders
- ✅ **24-hour advance** reminders for tomorrow's sessions
- ✅ **Personalized content** with customer and session details

### **3. Admin Dashboard Integration**
- ✅ **Session Reminders button** in Availability tab
- ✅ **Real-time status** showing sending progress
- ✅ **Success/failure feedback** with detailed results
- ✅ **Preview functionality** to see tomorrow's sessions

## 🚀 **How to Use:**

### **Manual Session Reminders:**
1. Go to **Admin Dashboard** → **Availability** tab
2. Scroll down to **"Session Reminders"** section
3. Click **"Send Tomorrow's Reminders"** button
4. System will send reminders to all customers with sessions tomorrow

### **Automatic Reminders (Cron Job):**
Set up a cron job to call this endpoint daily:
```
GET https://yourdomain.com/api/cron/send-reminders
Authorization: Bearer your-cron-secret
```

**Cron Schedule Example:**
```bash
# Run daily at 6 PM
0 18 * * * curl -H "Authorization: Bearer your-cron-secret" https://yourdomain.com/api/cron/send-reminders
```

## ⚙️ **Configuration Required:**

### **1. Environment Variables**
Add to your `.env.local`:
```bash
# Email Configuration (Gmail SMTP - FREE)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-digit-app-password

# Optional: For cron job security
CRON_SECRET=your-secure-random-string

# Optional: Admin email for notifications
ADMIN_EMAIL=admin@yourdomain.com
```

### **2. Gmail Setup (FREE)**
1. Enable 2-Factor Authentication: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the 16-digit App Password (not your regular password)

## 📧 **Email Templates Available:**

### **1. Booking Confirmation**
- **Trigger**: When customer completes booking
- **Content**: Session details, preparation tips, meeting link
- **Template Key**: `booking_confirmation`

### **2. Session Reminder**
- **Trigger**: 24 hours before session (manual or automatic)
- **Content**: Tomorrow's session details, preparation checklist
- **Template Key**: `booking_reminder`

### **3. Admin Notification**
- **Trigger**: When new booking is made
- **Content**: Customer details, session info, next steps
- **Recipient**: Admin email

## 🔧 **API Endpoints:**

### **Manual Reminders:**
```
POST /api/admin/send-session-reminders
Content-Type: application/json
{
  "type": "manual"
}
```

### **Automatic Reminders (Cron):**
```
GET /api/cron/send-reminders
Authorization: Bearer your-cron-secret
```

### **Preview Tomorrow's Sessions:**
```
GET /api/admin/send-session-reminders
```

## 📊 **Features:**

### **✅ What's Working:**
- **Booking confirmation emails** - Sent automatically on payment
- **Session reminder emails** - Manual and automatic sending
- **Admin notifications** - New booking alerts
- **Email templates** - Customizable through admin dashboard
- **Gmail SMTP** - Free email service (500 emails/day)
- **Error handling** - Graceful failure with logging
- **Email logging** - Track sent emails in database

### **🎯 Email Limits (Gmail Free):**
- **Daily limit**: 500 emails
- **Recipients per email**: 500
- **Perfect for**: Small to medium coaching businesses

## 🚨 **Troubleshooting:**

### **"Email service not configured" Error:**
- ✅ Check `.env.local` file exists
- ✅ Verify `EMAIL_USER` and `EMAIL_PASS` are set
- ✅ Use App Password, not regular Gmail password
- ✅ Restart development server after adding env vars

### **"Authentication failed" Error:**
- ✅ Enable 2FA on Gmail account
- ✅ Generate new App Password
- ✅ Remove spaces from App Password
- ✅ Double-check email address

### **Reminders not sending:**
- ✅ Check if customers have sessions tomorrow
- ✅ Verify email templates exist in database
- ✅ Check email service configuration
- ✅ Look at browser console for errors

## 🎉 **Result:**

**Your email notification system is now fully functional!**

- ✅ **New bookings** → Automatic confirmation emails
- ✅ **Session reminders** → Manual and automatic sending
- ✅ **Admin notifications** → New booking alerts
- ✅ **Professional templates** → Customizable email designs
- ✅ **Free email service** → Gmail SMTP (no API keys needed)

**Test it now:**
1. Make a test booking
2. Check your email for confirmation
3. Go to Admin Dashboard → Availability → Send Tomorrow's Reminders
4. Set up cron job for automatic daily reminders

Your customers will now receive professional email notifications for all their bookings and session reminders!

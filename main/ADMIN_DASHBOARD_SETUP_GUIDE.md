# Enhanced Admin Dashboard Setup Guide

## Overview
Your admin dashboard has been significantly enhanced with the following new features:

### ✅ Completed Features

1. **Dark Theme Consistency**: All components now use consistent dark theme (gray-800/700 backgrounds)
2. **Business Hours Manager**: Complete working days/times, breaks, and holidays management
3. **Enhanced Busy Slots Manager**: Full CRUD operations with edit/delete capabilities
4. **Advanced User Management**: User deletion, banning, and bulk operations with email notifications
5. **Email Template System**: Visual template editor with dark theme and bulk sending

### 🔧 Setup Required

## 1. Database Setup

**Important**: You need to create the database tables manually in Supabase.

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `database_setup.sql` (in your project root)
4. Execute the SQL to create all required tables

**Tables being created**:
- `email_templates` - Store email templates with placeholders
- `email_logs` - Track sent emails and delivery status
- `business_hours` - Store working days, times, and breaks
- `holidays` - Store holiday dates and recurring holidays

## 2. Email Configuration

### Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification
   - App passwords → Generate password for "Mail"
   - Copy the 16-character password

3. **Add Environment Variables**:
   Add these to your `.env.local` file:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   ```

### Alternative Email Providers

If using other providers, update the transporter configuration in:
- `/src/app/api/admin/users/route.js`
- `/src/app/api/admin/email-templates/route.js`

## 3. Testing the Setup

### Test Database Connection
```bash
curl -X GET http://localhost:3000/api/admin/database-setup
```

### Test Email Templates
1. Go to Admin Dashboard → Email Templates tab
2. Select a template
3. Click "Send Test Email"
4. Enter your email address
5. Check if the email is received

### Test Business Hours
1. Go to Admin Dashboard → Availability tab
2. Configure your business hours
3. Add breaks and holidays
4. Save configuration

### Test User Management
1. Go to Admin Dashboard → Users tab
2. Try bulk operations (without sending emails initially)
3. Test individual user actions

## 4. Features Overview

### Business Hours Manager
- **Working Days**: Enable/disable days of the week
- **Time Slots**: Set start/end times for each day
- **Breaks**: Add multiple breaks per day
- **Multi-day Selection**: Apply same settings to multiple days
- **Holidays**: Add one-time or recurring holidays

### Enhanced Busy Slots Manager
- **View All Slots**: See all existing busy slots
- **Add New Slots**: Create busy slots with date/time
- **Edit Existing**: Modify existing slots inline
- **Delete with Confirmation**: Remove slots with confirmation dialog
- **Email Notifications**: Send notifications when slots are modified

### Advanced User Management
- **User Overview**: See user stats (bookings, spending, status)
- **Search & Filter**: Find users by email, name, or status
- **Bulk Operations**: Select multiple users for batch actions
- **Ban Users**: Temporary or permanent bans with email notifications
- **Delete Users**: Remove user accounts with confirmation emails
- **Email Integration**: Notify users of account changes

### Email Template System
- **Visual Editor**: Rich HTML editor with live preview
- **Template Library**: Pre-built templates for common scenarios
- **Placeholder System**: Dynamic content replacement
- **Bulk Sending**: Send to multiple recipients
- **Email Logs**: Track delivery status and errors
- **Test Mode**: Send test emails before bulk operations

## 5. API Endpoints

### New/Enhanced Endpoints:
- `GET/POST /api/admin/users` - Enhanced user management
- `PUT /api/admin/users` - Ban/unban users
- `DELETE /api/admin/users` - Delete users
- `GET/POST /api/admin/business-hours` - Business hours management
- `GET/POST/PUT/DELETE /api/admin/email-templates` - Email templates
- `GET/POST /api/admin/database-setup` - Database status and setup

## 6. Dark Theme Implementation

All components now follow consistent dark theme:
- **Backgrounds**: gray-800, gray-700, gray-600
- **Text**: white, gray-100, gray-200
- **Accents**: orange-500, orange-600
- **Borders**: gray-600, gray-700
- **Inputs**: gray-700 backgrounds with white text

## 7. Troubleshooting

### Email Issues
- Verify EMAIL_USER and EMAIL_PASS are correct
- Check Gmail App Password (not regular password)
- Ensure 2FA is enabled on Gmail account
- Check spam folder for test emails

### Database Issues
- Verify all SQL commands executed successfully
- Check Supabase table permissions
- Ensure RLS policies allow admin operations

### UI Issues
- All components use consistent gray-800/700 theme
- Check browser console for React errors
- Verify component imports in dashboard page

## 8. Next Steps

1. **Execute SQL Setup**: Run the database_setup.sql in Supabase
2. **Configure Email**: Add email credentials to environment
3. **Test Each Feature**: Verify all functionality works
4. **Customize Templates**: Modify email templates for your brand
5. **Set Business Hours**: Configure your actual operating hours

## 9. Security Notes

- Email credentials are environment variables (not in code)
- User operations require admin authentication
- Database tables have RLS enabled
- All API routes have error handling and validation

Your admin dashboard is now significantly more powerful with comprehensive management capabilities for users, schedules, and communications!

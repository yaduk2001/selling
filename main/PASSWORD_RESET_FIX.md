# Password Reset Fix Documentation

## Issues Fixed

### 1. Auth Callback Handler
**Problem**: The auth callback route wasn't handling password reset flow properly.
**Fix**: Updated `/src/app/auth/callback/route.js` to:
- Check for `type=recovery` parameter
- Handle both code-based and token-based reset flows
- Redirect to reset-password page for recovery type

### 2. Reset Password Page Session Handling
**Problem**: The reset password page wasn't properly validating sessions.
**Fix**: Updated `/src/app/auth/reset-password/page.js` to:
- Check for both URL tokens and active sessions
- Add loading state while verifying session
- Better error handling with actionable messages
- Improved user experience with proper status indicators

## How Password Reset Works Now

### Flow 1: Code-based Reset (Recommended)
1. User requests password reset via `/auth/forgot-password`
2. Supabase sends email with link containing `code` parameter
3. User clicks link → redirects to `/auth/callback?code=...&type=recovery`
4. Callback exchanges code for session → redirects to `/auth/reset-password`
5. Reset page detects active session → allows password update

### Flow 2: Token-based Reset (Fallback)
1. User requests password reset
2. Email contains direct tokens
3. Link goes to `/auth/reset-password?access_token=...&refresh_token=...&type=recovery`
4. Reset page validates tokens → allows password update

## Supabase Configuration Required

### 1. Auth Settings
In your Supabase dashboard, go to **Authentication > Settings**:

#### Site URL
```
https://yourdomain.com
```
For development:
```
http://localhost:3000
```

#### Redirect URLs
Add these URLs:
```
http://localhost:3000/auth/callback
http://localhost:3000/auth/reset-password
https://yourdomain.com/auth/callback
https://yourdomain.com/auth/reset-password
```

### 2. Email Templates
Go to **Authentication > Email Templates > Reset Password**:

#### Subject
```
Reset your password for {{ .SiteName }}
```

#### Body (HTML)
```html
<h2>Reset your password</h2>
<p>Hi there,</p>
<p>You recently requested to reset your password for {{ .SiteName }}.</p>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>Thanks,<br>The {{ .SiteName }} Team</p>
```

#### Important Settings
- Make sure "Enable this template" is checked
- Set appropriate expiration time (default 1 hour is fine)

### 3. SMTP Configuration
Go to **Settings > Auth** and configure SMTP:
- **SMTP Host**: Your email provider's SMTP server
- **SMTP Port**: Usually 587 or 465
- **SMTP User**: Your SMTP username
- **SMTP Pass**: Your SMTP password
- **Sender Name**: Your app name
- **Sender Email**: Your verified sender email

## Testing the Reset Flow

### 1. Test with Real Email
```javascript
// Update test-reset-password.js with a real email
const testEmail = 'your-real-email@example.com';
```

Run the test:
```bash
node test-reset-password.js
```

### 2. Manual Testing
1. Go to `/auth/forgot-password`
2. Enter your email address
3. Check your email (including spam folder)
4. Click the reset link
5. Verify you're redirected to reset password page
6. Enter new password and confirm
7. Should redirect to login with success message

## Troubleshooting

### Email Not Received
1. **Check SMTP configuration** in Supabase dashboard
2. **Check spam folder** in your email
3. **Verify email template is enabled** in Auth settings
4. **Check Supabase logs** in dashboard for email errors

### Invalid Reset Link Error
1. **Check redirect URLs** in Supabase Auth settings
2. **Verify link hasn't expired** (default 1 hour)
3. **Ensure callback route is working** - check server logs
4. **Check for URL encoding issues** in email template

### Password Update Fails
1. **Verify user session is active** during reset
2. **Check password requirements** (minimum 6 characters)
3. **Ensure user exists** in the database
4. **Check Supabase RLS policies** if enabled

### Link Redirects to Wrong Page
1. **Check Site URL** in Supabase Auth settings
2. **Verify callback route** handles recovery type
3. **Check email template URL** format

## Common Configuration Mistakes

### 1. Missing Redirect URLs
```bash
# Add ALL these URLs to Supabase:
http://localhost:3000/auth/callback
http://localhost:3000/auth/reset-password
https://yourdomain.com/auth/callback  
https://yourdomain.com/auth/reset-password
```

### 2. Wrong Site URL
```bash
# Development
Site URL: http://localhost:3000

# Production  
Site URL: https://yourdomain.com
```

### 3. Email Template Issues
- Template not enabled
- Wrong confirmation URL format
- Missing required variables

### 4. SMTP Not Configured
- No SMTP settings = no emails sent
- Wrong credentials = email failures
- Missing sender verification

## Security Considerations

1. **Reset links expire** after 1 hour by default
2. **One-time use** - links become invalid after use
3. **Secure tokens** - handled entirely by Supabase
4. **Rate limiting** - Supabase prevents spam requests
5. **Email verification** - Only works for confirmed email addresses

## Additional Features

### Custom Email Styling
You can customize the email template with CSS and better HTML structure in the Supabase dashboard.

### Error Logging
The app now logs authentication errors for debugging:
```javascript
console.error('Error in auth callback:', error);
```

### User Feedback
Users now get clear status messages:
- Loading states during verification
- Clear error messages with actionable steps
- Success confirmation with auto-redirect

## File Changes Made

1. **`/src/app/auth/callback/route.js`** - Enhanced to handle recovery flow
2. **`/src/app/auth/reset-password/page.js`** - Improved session validation and UX
3. **`/test-reset-password.js`** - Created testing script

The password reset functionality should now work reliably with proper error handling and user feedback.

# Supabase Authentication Configuration for Password Reset

To ensure the password reset functionality works correctly, you need to configure the Supabase authentication settings properly.

## Current Settings

Currently, only the Email provider is enabled, but other important settings are disabled:
- ✅ Email provider: Enabled
- ❌ Confirm email: Disabled
- ❌ Secure email change: Disabled
- ❌ Secure password change: Disabled
- ❌ Prevent use of leaked passwords: Disabled

## Recommended Settings for Password Reset

For the password reset functionality to work optimally, we recommend enabling at least these settings:

### Critical
- ✅ Email provider: Must be enabled
- ✅ Confirm email: Should be enabled to verify user emails

### Security Enhancements (Optional)
- ✅ Secure password change: Recommended for better security
- ✅ Prevent use of leaked passwords: Recommended to protect users

## How to Configure Supabase

1. Log in to your Supabase dashboard
2. Go to Authentication > Settings
3. Under "Providers" tab, make sure "Email" is enabled
4. Under "Email Auth" section, enable the required settings:
   - Check "Confirm email"
   - Optionally check "Secure password change"
   - Optionally check "Prevent use of leaked passwords"
5. Save your changes

## Notes for the Current Configuration

If you prefer to keep the current configuration:

1. Be aware that users can reset their passwords without email verification
2. The reset password link will still work, but it offers less security
3. Consider adding additional user verification in your application
4. Make sure the Site URL in Supabase matches your application's URL

## Testing

After configuration, test the password reset flow by:
1. Clicking "Forgot password?" on the login page
2. Entering your email address
3. Checking your email for the reset link
4. Following the link to set a new password

If the reset link redirects to the homepage instead of the reset password page, check that the Site URL in Supabase matches your application's URL. 
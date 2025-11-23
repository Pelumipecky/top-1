# Admin Login Setup Guide

## Overview
This guide explains how to set up and use the admin login functionality for the TopMint application.

## Admin Account Created

An admin account has been automatically created during the setup process with the following credentials:

- **Email**: `admin@topmint.com`
- **Password**: `TopMint@123`
- **Admin ID**: `99999999`

## ⚠️ IMPORTANT: Email Confirmation Required

**If you see "Email not confirmed" error when logging in, follow these steps:**

### Option 1: Automatic Email Confirmation (Recommended)
1. Get your Supabase service role key:
   - Go to https://supabase.com/dashboard/project/inofcvykmbovozqwehin
   - Navigate to **Settings → API**
   - Copy the **"service_role"** key (starts with `eyJ...`)
   - Add it to your `.env.local` file as: `SUPABASE_SERVICE_ROLE_KEY=your_key_here`

2. Run the confirmation script:
   ```bash
   node scripts/confirm-admin-email.js
   ```

3. The script will automatically confirm the admin email

### Option 2: Manual Confirmation in Supabase Dashboard
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/inofcvykmbovozqwehin
2. Navigate to **Authentication → Users**
3. Find the user with email: `admin@topmint.com`
4. Click on the user row to open details
5. Look for "Email confirmed" checkbox or "Confirm user" button
6. Check the box or click the button to confirm
7. Save the changes

### Option 3: Disable Email Confirmation Globally
1. Go to **Authentication → Settings**
2. Scroll to **"Email Auth"** section
3. Uncheck **"Enable email confirmations"**
4. Save settings
5. This disables email confirmation for all future users
5. This will disable email confirmation for all future users

## How to Access Admin Dashboard

1. Navigate to the admin login page: `http://localhost:3000/signin_admin`
2. Enter the admin credentials
3. Click "Sign In"
4. You will be redirected to the admin dashboard

## Admin Dashboard Features

The admin dashboard provides the following functionality:

- **User Management**: View and manage all registered users
- **Investment Management**: Monitor and manage user investments
- **Withdrawal Management**: Review and process withdrawal requests
- **Real-time Notifications**: View system notifications and alerts
- **Chat Support**: Respond to user messages
- **Analytics**: View platform statistics and metrics

## Security Notes

⚠️ **Important Security Measures:**

1. **Change Default Password**: Immediately change the default password after first login
2. **Use Strong Passwords**: Ensure all admin accounts use complex passwords
3. **Regular Monitoring**: Monitor admin access logs regularly
4. **Two-Factor Authentication**: Consider implementing 2FA for additional security

## Creating Additional Admin Accounts

To create additional admin accounts:

1. Use the API endpoint: `POST /api/create-admin`
2. Or manually insert records into the `userlogs` table with `admin: true`

## Troubleshooting

### Login Issues
- Ensure you're using the correct email and password
- Check that the user has `admin: true` in the database
- Clear browser cache and localStorage if experiencing issues

### Database Connection
- Verify Supabase environment variables are correctly set
- Check database connectivity
- Ensure RLS policies allow admin access

## API Endpoints

- `GET/POST /api/create-admin` - Create admin accounts
- `POST /signin_admin` - Admin authentication
- `GET /dashboard_admin` - Admin dashboard (requires authentication)

## Support

For technical support or issues with admin functionality, check:
1. Supabase dashboard for database issues
2. Application logs for error details
3. Network connectivity to Supabase services
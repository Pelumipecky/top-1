# Firebase to Supabase Migration Guide

## Overview
This guide covers migrating your TopmintInvest application from Firebase to Supabase.

## Prerequisites
- Supabase account and project
- Supabase project URL and anon key
- Database access to run SQL schema

## Step 1: Environment Setup

### 1.1 Update Environment Variables
Replace the Firebase variables in `.env.local` with Supabase credentials:

```env
# Remove these Firebase variables:
# NEXT_PUBLIC_FIREBASE_API_KEY=...
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# etc.

# Add these Supabase variables:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 1.2 Install Supabase Package
```bash
npm install @supabase/supabase-js
```

## Step 2: Database Migration

### 2.1 Create Supabase Database Schema
Run the SQL in `supabase-schema.sql` in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Run the SQL script

### 2.2 Migrate Existing Data
You'll need to export data from Firebase and import it to Supabase:

#### Export from Firebase:
```javascript
// Create a script to export Firebase data
import { db } from './firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

async function exportData() {
  // Export users
  const usersSnapshot = await getDocs(collection(db, 'userlogs'));
  const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Export other collections similarly
  // ...investments, notifications, kyc

  // Save to JSON files
  require('fs').writeFileSync('users.json', JSON.stringify(users, null, 2));
}
```

#### Import to Supabase:
```javascript
// Create a script to import data to Supabase
import { supabase } from './supabaseConfig';

async function importData() {
  const users = require('./users.json');

  for (const user of users) {
    const { data, error } = await supabase
      .from('userlogs')
      .insert([user]);
    if (error) console.error('Error importing user:', error);
  }
}
```

## Step 3: Code Updates

### 3.1 Configuration Files
- ✅ `src/database/firebaseConfig.js` - Updated with Supabase client
- ✅ `src/database/supabaseUtils.js` - New Supabase utility functions

### 3.2 Authentication Updates
- ✅ `src/pages/signin.jsx` - Updated to use Supabase Auth
- 🔄 `src/pages/signup.jsx` - Needs updating (see below)

### 3.3 Database Operations
- ✅ `src/pages/profile.jsx` - Updated real-time listeners
- ✅ `src/components/dashboard/KYC.jsx` - Updated file uploads and database operations

### 3.4 Remaining Updates Needed

#### Update Signup Page
```javascript
// In src/pages/signup.jsx, replace Firebase auth with:
import { supabaseAuth } from '../database/firebaseConfig';

// Replace sign up logic with:
const { data, error } = await supabaseAuth.signUp(email, password, {
  name: fullName,
  // other user data
});
```

#### Update Admin Components
Update all admin components that use Firebase:
- `src/components/dashAdmin/InvestAdminSect.jsx`
- `src/components/dashAdmin/UsersAdmin.jsx`
- Other admin components

#### Update API Routes
Update any API routes in `src/pages/api/` that use Firebase.

## Step 4: Storage Migration

### 4.1 Create Storage Buckets
The schema creates these buckets:
- `kyc-documents` - For KYC files
- `avatars` - For user avatars

### 4.2 Migrate Existing Files
Use Supabase CLI or manual upload to migrate Firebase Storage files:

```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Push storage changes
supabase db push
```

## Step 5: Testing

### 5.1 Test Authentication
1. Sign up new user
2. Sign in existing user
3. Check user data loading

### 5.2 Test Database Operations
1. Create investment
2. Update user profile
3. Submit KYC documents

### 5.3 Test Real-time Features
1. Check live balance updates
2. Test notification system
3. Verify investment status updates

## Step 6: Security Configuration

### 6.1 Update RLS Policies
The schema includes basic policies. For production, update them:

```sql
-- Example: Allow users to read only their own data
CREATE POLICY "Users can view own data" ON userlogs
FOR SELECT USING (auth.uid()::text = id);

-- Allow users to update their own data
CREATE POLICY "Users can update own data" ON userlogs
FOR UPDATE USING (auth.uid()::text = id);
```

### 6.2 Storage Policies
Update storage policies for proper access control:

```sql
-- Allow authenticated users to upload their own KYC documents
CREATE POLICY "Users can upload own KYC" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'kyc-documents'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## Step 7: Deployment

### 7.1 Update Build Configuration
Ensure Supabase environment variables are set in your deployment platform.

### 7.2 Update Netlify/Vercel Config
Add Supabase environment variables to your deployment settings.

## Common Issues & Solutions

### Issue: Real-time subscriptions not working
**Solution**: Ensure RLS policies allow the operations, and check Supabase dashboard for connection issues.

### Issue: File uploads failing
**Solution**: Check storage bucket policies and ensure proper bucket names.

### Issue: Authentication errors
**Solution**: Verify Supabase URL and anon key are correct, and check Supabase Auth settings.

### Issue: Data not loading
**Solution**: Check RLS policies and ensure proper foreign key relationships.

## Rollback Plan

If you need to rollback to Firebase:

1. Revert all code changes
2. Restore Firebase configuration
3. Reinstall Firebase packages
4. Restore Firebase data from backups

## Support

For Supabase-specific issues:
- Check Supabase documentation: https://supabase.com/docs
- Community forums: https://github.com/supabase/supabase/discussions
- Discord: https://supabase.com/discord

## Migration Checklist

- [ ] Environment variables updated
- [ ] Supabase package installed
- [ ] Database schema created
- [ ] Data migrated from Firebase
- [ ] Authentication updated
- [ ] Database operations updated
- [ ] Storage operations updated
- [ ] Real-time subscriptions updated
- [ ] Security policies configured
- [ ] Testing completed
- [ ] Deployment updated
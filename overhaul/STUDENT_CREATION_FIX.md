# Fix for Student Creation Issue: "User Not Allowed"

## Problem

The "user not allowed" error occurs because the Auth Admin API requires the Supabase service role key, which has elevated permissions to manage users.

## Solution

### Step 1: Get Your Service Role Key

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `ckeoyzdnwywqyrmeelpy`
3. Go to Settings → API
4. Copy the "service_role" key (NOT the "anon" key)
5. This key looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (much longer than anon key)

### Step 2: Update Your Environment File

Replace the line in your `.env.local` file:

```bash
# Replace this line:
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# With this (using your actual service role key):
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...YOUR_ACTUAL_SERVICE_ROLE_KEY
```

### Step 3: Update Database Policies (Run in Supabase SQL Editor)

I've created a fix script at `fix_admin_permissions.sql`. Run this in your Supabase SQL editor to ensure your admin email has the correct permissions.

### Step 4: Restart Your Development Server

After updating the `.env.local` file:

```bash
# Stop the current dev server (Ctrl+C)
# Then restart:
npm run dev
```

## Security Notes

⚠️ **IMPORTANT**: The service role key has admin privileges. Never expose it in client-side code or commit it to public repositories. It should only be used server-side.

- ✅ Use in API routes and server-side operations
- ❌ Never use in client-side components
- ❌ Never commit to public git repositories

## What This Fixes

With the correct service role key, you'll be able to:

- Create new student accounts
- Edit student information
- Delete student accounts
- Manage student materials and assignments

The error "user not allowed" should disappear once the service role key is properly configured.

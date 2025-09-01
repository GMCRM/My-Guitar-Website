-- Diagnostic Script - Check Admin Setup
-- Run this to see what's wrong with admin permissions
-- 1. Check if you're logged in and what your user details are
SELECT auth.uid() as my_user_id,
    auth.email() as my_email,
    CASE
        WHEN auth.email() = 'grantmatai@gmail.com' THEN 'ADMIN ACCESS ✓'
        ELSE 'NOT ADMIN ✗ (email: ' || auth.email() || ')'
    END as admin_status;
-- 2. Check if the student-materials bucket exists
SELECT id,
    name,
    public,
    CASE
        WHEN id = 'student-materials' THEN 'BUCKET EXISTS ✓'
        ELSE 'BUCKET MISSING ✗'
    END as bucket_status
FROM storage.buckets
WHERE id = 'student-materials';
-- 3. Check if you can see auth.users (admin permission test)
SELECT COUNT(*) as total_users,
    CASE
        WHEN COUNT(*) > 0 THEN 'CAN ACCESS USERS ✓'
        ELSE 'CANNOT ACCESS USERS ✗'
    END as users_access
FROM auth.users;
-- 4. Check your user record specifically
SELECT id,
    email,
    created_at,
    CASE
        WHEN email = 'grantmatai@gmail.com' THEN 'EMAIL MATCHES ✓'
        ELSE 'EMAIL MISMATCH ✗'
    END as email_check
FROM auth.users
WHERE id = auth.uid();
-- 5. Simple storage test - check if storage.objects table exists
SELECT COUNT(*) as object_count,
    'storage.objects table exists ✓' as storage_status
FROM storage.objects
LIMIT 1;
-- Simple Auth Check - Step by Step
-- Run each query separately to see where it fails
-- Step 1: Check if you're logged in at all
SELECT 'Step 1: Auth Check' as step;
SELECT COALESCE(auth.uid()::text, 'NULL') as user_id,
    COALESCE(auth.email(), 'NULL') as email;
-- Step 2: Check bucket existence (should work even without admin)
SELECT 'Step 2: Bucket Check' as step;
SELECT name,
    public
FROM storage.buckets
WHERE name = 'student-materials';
-- Step 3: Try to access auth.users (requires admin/service role)
SELECT 'Step 3: Users Table Access' as step;
SELECT COUNT(*) as user_count
FROM auth.users;
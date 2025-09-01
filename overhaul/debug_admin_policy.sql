-- Debug Admin Policy - Check Exact Policy Conditions
-- This will help us see why the policy isn't working
-- 1. Check what auth.email() returns when you're logged in
SELECT 'Current auth status:' as info,
    auth.uid() as user_id,
    auth.email() as current_email,
    auth.role() as current_role;
-- 2. Check the exact policy conditions for student-materials bucket
SELECT 'Policy details:' as info,
    polname as policy_name,
    cmd as command_type,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policy pol
    JOIN pg_class cls ON pol.polrelid = cls.oid
    JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
WHERE cls.relname = 'objects'
    AND nsp.nspname = 'storage'
    AND polname LIKE '%student%'
    OR polname LIKE '%admin%';
-- 3. Test the exact policy condition
SELECT 'Policy test:' as test,
    CASE
        WHEN auth.email() = 'grantmatai@gmail.com' THEN 'EMAIL MATCHES ✓'
        ELSE 'EMAIL MISMATCH ✗ (got: ' || COALESCE(auth.email(), 'NULL') || ')'
    END as email_check,
    CASE
        WHEN auth.role() = 'authenticated' THEN 'ROLE AUTHENTICATED ✓'
        ELSE 'ROLE ISSUE ✗ (got: ' || COALESCE(auth.role(), 'NULL') || ')'
    END as role_check;
-- Temporary Policy Fix for Admin Upload
-- Try to create a more permissive policy for testing
-- First, check what we have
SELECT 'Current policies:' as info,
    polname,
    cmd,
    qual
FROM pg_policy pol
    JOIN pg_class cls ON pol.polrelid = cls.oid
    JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
WHERE cls.relname = 'objects'
    AND nsp.nspname = 'storage'
    AND polname LIKE '%student%';
-- Try to create a simple test policy (this might fail due to permissions)
DO $$ BEGIN -- Create a very permissive policy for testing
CREATE POLICY "temp_admin_upload_test" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'student-materials'
        AND (
            auth.email() = 'grantmatai@gmail.com'
            OR auth.role() = 'authenticated'
        )
    );
RAISE NOTICE 'Temporary policy created successfully';
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE 'Could not create policy: %',
SQLERRM;
END $$;
-- Alternative: Test with the public bucket
SELECT 'Testing public bucket policy:' as test;
INSERT INTO storage.buckets (id, name, public)
VALUES ('test-public', 'test-public', true) ON CONFLICT (id) DO
UPDATE
SET public = true;
SELECT 'Public bucket created/updated' as status;
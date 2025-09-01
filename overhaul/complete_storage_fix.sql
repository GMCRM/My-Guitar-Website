-- Complete Storage Reset and Fix
-- This will properly set up storage with the right permissions
-- 1. First, let's make sure the bucket exists and is properly configured
INSERT INTO storage.buckets (
        id,
        name,
        public,
        file_size_limit,
        allowed_mime_types
    )
VALUES (
        'student-materials',
        'student-materials',
        false,
        -- Keep it private
        52428800,
        -- 50MB limit
        ARRAY ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    ) ON CONFLICT (id) DO
UPDATE
SET public = false,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
-- 2. Remove all existing policies
DROP POLICY IF EXISTS "Admin can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Admin can view files" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete files" ON storage.objects;
DROP POLICY IF EXISTS "temp_allow_all" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin access" ON storage.objects;
-- 3. Create new policies that work with authenticated users
-- For uploads - allow authenticated users to upload to student-materials bucket
CREATE POLICY "Allow authenticated uploads to student materials" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'student-materials'
        AND auth.role() = 'authenticated'
    );
-- For viewing - allow authenticated users to view files in student-materials bucket
CREATE POLICY "Allow authenticated users to view student materials" ON storage.objects FOR
SELECT USING (
        bucket_id = 'student-materials'
        AND auth.role() = 'authenticated'
    );
-- For deleting - allow authenticated users to delete files in student-materials bucket
CREATE POLICY "Allow authenticated users to delete student materials" ON storage.objects FOR DELETE USING (
    bucket_id = 'student-materials'
    AND auth.role() = 'authenticated'
);
-- 4. Make sure RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
-- 5. Verify setup
SELECT 'Storage setup complete' as status,
    'Bucket: ' || name as bucket_info,
    'Public: ' || public::text as public_status
FROM storage.buckets
WHERE id = 'student-materials';
SELECT 'Policies created: ' || COUNT(*)::text as policy_count
FROM pg_policies
WHERE tablename = 'objects'
    AND schemaname = 'storage';
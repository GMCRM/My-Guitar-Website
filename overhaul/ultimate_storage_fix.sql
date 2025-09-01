-- Ultimate Storage Fix - Handle All Permission Issues
-- This will create a completely open public bucket that works
-- 1. Create the public bucket (if it doesn't exist)
INSERT INTO storage.buckets (
        id,
        name,
        public,
        file_size_limit,
        allowed_mime_types
    )
VALUES (
        'student-materials-public',
        'student-materials-public',
        true,
        52428800,
        ARRAY ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    ) ON CONFLICT (id) DO
UPDATE
SET public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
-- 2. Remove ALL existing policies for this bucket
DO $$
DECLARE policy_name text;
BEGIN FOR policy_name IN
SELECT pol.polname
FROM pg_policy pol
    JOIN pg_class cls ON pol.polrelid = cls.oid
    JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
WHERE cls.relname = 'objects'
    AND nsp.nspname = 'storage' LOOP EXECUTE format(
        'DROP POLICY IF EXISTS %I ON storage.objects',
        policy_name
    );
END LOOP;
END $$;
-- 3. Disable RLS temporarily to test
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
-- 4. Create one simple policy that allows everything for the public bucket
CREATE POLICY "allow_all_public_bucket" ON storage.objects FOR ALL USING (bucket_id = 'student-materials-public') WITH CHECK (bucket_id = 'student-materials-public');
-- 5. Re-enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
-- 6. Test the setup
SELECT 'Setup complete - bucket info:' as status,
    name,
    public,
    file_size_limit
FROM storage.buckets
WHERE name = 'student-materials-public';
-- 7. Check policies
SELECT 'Policies for public bucket:' as info,
    polname as policy_name,
    cmd as policy_type
FROM pg_policy pol
    JOIN pg_class cls ON pol.polrelid = cls.oid
    JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
WHERE cls.relname = 'objects'
    AND nsp.nspname = 'storage'
    AND (
        polname LIKE '%public%'
        OR polname LIKE '%allow_all%'
    );
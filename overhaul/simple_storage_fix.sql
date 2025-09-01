-- Simple Storage Fix - No Admin Required
-- This creates policies without needing table ownership
-- 1. Create a public bucket as fallback (this should work)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
        'student-materials-public',
        'student-materials-public',
        true,
        52428800
    ) ON CONFLICT (id) DO
UPDATE
SET public = true,
    file_size_limit = 52428800;
-- 2. Create simple policies for the public bucket (should work without admin)
DO $$ BEGIN -- Remove existing policies if they exist
DROP POLICY IF EXISTS "Public bucket access" ON storage.objects;
-- Create a simple policy for public bucket
CREATE POLICY "Public bucket access" ON storage.objects FOR ALL USING (bucket_id = 'student-materials-public');
EXCEPTION
WHEN OTHERS THEN -- If policy creation fails, just continue
RAISE NOTICE 'Policy creation failed, continuing...';
END $$;
-- 3. Verify what we have
SELECT 'Buckets available:' as info,
    name,
    public
FROM storage.buckets
WHERE name LIKE '%student%'
ORDER BY name;
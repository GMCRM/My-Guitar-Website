-- Alternative Storage Setup - Public Bucket Approach
-- If policies are causing issues, try this approach
-- 1. Create a PUBLIC bucket (easier for testing)
INSERT INTO storage.buckets (id, name, public)
VALUES (
        'student-materials-public',
        'student-materials-public',
        true
    ) ON CONFLICT (id) DO NOTHING;
-- 2. No policies needed for public bucket - but let's try simple ones anyway
DROP POLICY IF EXISTS "Anyone can upload to public student materials" ON storage.objects;
CREATE POLICY "Anyone can upload to public student materials" ON storage.objects FOR ALL USING (bucket_id = 'student-materials-public');
-- 3. Check if bucket was created
SELECT id,
    name,
    public,
    'Public bucket created - should work without complex policies' as status
FROM storage.buckets
WHERE id = 'student-materials-public';
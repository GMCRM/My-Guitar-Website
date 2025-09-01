-- URGENT FIX: Remove problematic RLS policies temporarily
-- Run this to allow uploads while we debug
-- Option 1: Temporarily disable all storage policies (for testing)
DROP POLICY IF EXISTS "Admin can upload student materials" ON storage.objects;
DROP POLICY IF EXISTS "Admin can view student materials" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update student materials" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete student materials" ON storage.objects;
DROP POLICY IF EXISTS "Students can download own materials" ON storage.objects;
-- Option 2: Create a simple "allow all" policy for testing
CREATE POLICY "Temporary allow all uploads" ON storage.objects FOR ALL USING (bucket_id = 'student-materials');
-- Check if bucket exists
SELECT id,
    name,
    public,
    'Bucket exists, policies removed for testing' as status
FROM storage.buckets
WHERE id = 'student-materials';
-- Emergency Storage Fix - Temporarily Disable RLS
-- WARNING: This makes storage public temporarily for testing
-- Run this, test uploads, then run the restore script
-- 1. Temporarily disable RLS on storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
-- 2. Create a simple policy that allows everything (TEMPORARY)
DROP POLICY IF EXISTS "temp_allow_all" ON storage.objects;
CREATE POLICY "temp_allow_all" ON storage.objects FOR ALL USING (true);
-- 3. Re-enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
-- Check if bucket exists and create if missing
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-materials', 'student-materials', true) ON CONFLICT (id) DO
UPDATE
SET public = true;
SELECT 'Emergency fix applied - test your uploads now' as status;
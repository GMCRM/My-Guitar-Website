-- Minimal Storage Setup (Run this if the main script fails)
-- This creates just the bucket and basic policies
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-materials', 'student-materials', false) ON CONFLICT (id) DO NOTHING;
-- Simple admin policy (covers all operations)
DROP POLICY IF EXISTS "Admin full access" ON storage.objects;
CREATE POLICY "Admin full access" ON storage.objects FOR ALL USING (
    bucket_id = 'student-materials'
    AND EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'grantmatai@gmail.com'
    )
);
-- Verify bucket exists
SELECT 'Bucket created: ' || id AS result
FROM storage.buckets
WHERE id = 'student-materials';
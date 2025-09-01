-- Storage Setup for Student Materials
-- Run this in Supabase SQL Editor to fix storage issues
-- 1. Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-materials', 'student-materials', false) ON CONFLICT (id) DO NOTHING;
-- 2. Drop any existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Students can download own materials" ON storage.objects;
DROP POLICY IF EXISTS "Admin can manage student materials" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload student materials" ON storage.objects;
DROP POLICY IF EXISTS "Admin can view student materials" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete student materials" ON storage.objects;
-- 3. Create comprehensive storage policies for admin access
CREATE POLICY "Admin can upload student materials" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'student-materials'
        AND EXISTS (
            SELECT 1
            FROM auth.users
            WHERE auth.users.id = auth.uid()
                AND auth.users.email = 'grantmatai@gmail.com'
        )
    );
CREATE POLICY "Admin can view student materials" ON storage.objects FOR
SELECT USING (
        bucket_id = 'student-materials'
        AND EXISTS (
            SELECT 1
            FROM auth.users
            WHERE auth.users.id = auth.uid()
                AND auth.users.email = 'grantmatai@gmail.com'
        )
    );
CREATE POLICY "Admin can update student materials" ON storage.objects FOR
UPDATE USING (
        bucket_id = 'student-materials'
        AND EXISTS (
            SELECT 1
            FROM auth.users
            WHERE auth.users.id = auth.uid()
                AND auth.users.email = 'grantmatai@gmail.com'
        )
    );
CREATE POLICY "Admin can delete student materials" ON storage.objects FOR DELETE USING (
    bucket_id = 'student-materials'
    AND EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'grantmatai@gmail.com'
    )
);
-- 4. Create policy for students to access their own materials
CREATE POLICY "Students can download own materials" ON storage.objects FOR
SELECT USING (
        bucket_id = 'student-materials'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
-- 5. Verify bucket was created
SELECT id,
    name,
    public
FROM storage.buckets
WHERE id = 'student-materials';
-- Success message (removed policies check that doesn't work)
SELECT 'Storage setup completed successfully!' AS status;
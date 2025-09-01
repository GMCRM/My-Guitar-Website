-- Fix Admin Permissions for Student Management
-- Run this in your Supabase SQL editor to update admin permissions
-- Drop existing policies that have the wrong email
DROP POLICY IF EXISTS "Admin can view all materials" ON student_materials;
DROP POLICY IF EXISTS "Admin can insert materials" ON student_materials;
DROP POLICY IF EXISTS "Admin can delete materials" ON student_materials;
DROP POLICY IF EXISTS "Admin can manage all assignments" ON student_assignments;
DROP POLICY IF EXISTS "Admin can manage student materials" ON storage.objects;
-- Recreate policies with the correct admin email
-- Admin can see all materials
CREATE POLICY "Admin can view all materials" ON student_materials FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'grantmatai@gmail.com'
    )
);
-- Admin can insert materials for any student
CREATE POLICY "Admin can insert materials" ON student_materials FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM auth.users
            WHERE auth.users.id = auth.uid()
                AND auth.users.email = 'grantmatai@gmail.com'
        )
    );
-- Admin can delete materials
CREATE POLICY "Admin can delete materials" ON student_materials FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'grantmatai@gmail.com'
    )
);
-- Admin can manage all assignments
CREATE POLICY "Admin can manage all assignments" ON student_assignments FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'grantmatai@gmail.com'
    )
);
-- Admin can manage all files in student-materials bucket
CREATE POLICY "Admin can manage student materials" ON storage.objects FOR ALL USING (
    bucket_id = 'student-materials'
    AND EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'grantmatai@gmail.com'
    )
);
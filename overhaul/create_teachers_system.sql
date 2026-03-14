-- Three-Tier Teacher Management System Database Migration
-- Run this in your Supabase SQL editor
-- Create the teachers table
CREATE TABLE IF NOT EXISTS teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{
    "can_manage_blog": false,
    "can_manage_materials": true,
    "can_assign_practice": true,
    "can_view_analytics": true,
    "can_manage_students": false,
    "can_upload_videos": false,
    "can_manage_messages": false
  }'::jsonb
);
-- Add assigned_teacher_id column to students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS assigned_teacher_id UUID REFERENCES teachers(id) ON DELETE
SET NULL;
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_teachers_active ON teachers(is_active)
WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_teachers_student_id ON teachers(student_id);
CREATE INDEX IF NOT EXISTS idx_students_assigned_teacher ON students(assigned_teacher_id);
-- Enable RLS (Row Level Security) on teachers table
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
-- Create authentication functions in public schema
CREATE OR REPLACE FUNCTION public.is_super_admin() RETURNS BOOLEAN AS $$ BEGIN RETURN auth.email() = 'grantmatai@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION public.is_teacher() RETURNS BOOLEAN AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.teachers
        WHERE email = auth.email()
            AND is_active = true
    )
    OR public.is_super_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION public.get_teacher_permissions() RETURNS JSONB AS $$
DECLARE teacher_perms JSONB;
BEGIN -- Super admin has all permissions
IF public.is_super_admin() THEN RETURN '{
      "can_manage_blog": true,
      "can_manage_materials": true,
      "can_assign_practice": true,
      "can_view_analytics": true,
      "can_manage_students": true,
      "can_upload_videos": true,
      "can_manage_messages": true
    }'::jsonb;
END IF;
-- Get teacher permissions
SELECT permissions INTO teacher_perms
FROM public.teachers
WHERE email = auth.email()
    AND is_active = true;
RETURN COALESCE(teacher_perms, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION public.get_assigned_students() RETURNS TABLE(student_id UUID) AS $$ BEGIN -- Super admin can see all students
    IF public.is_super_admin() THEN RETURN QUERY
SELECT id
FROM public.students;
END IF;
-- Teachers can only see their assigned students
RETURN QUERY
SELECT s.id
FROM public.students s
    JOIN public.teachers t ON s.assigned_teacher_id = t.id
WHERE t.email = auth.email()
    AND t.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Create policies for teachers table
CREATE POLICY "Super admin can manage all teachers" ON teachers FOR ALL USING (public.is_super_admin());
CREATE POLICY "Teachers can view their own record" ON teachers FOR
SELECT USING (
        email = auth.email()
        AND is_active = true
    );
-- Update students table policies for teacher assignments
DROP POLICY IF EXISTS "Teachers can view assigned students" ON students;
CREATE POLICY "Teachers can view assigned students" ON students FOR
SELECT USING (
        public.is_super_admin()
        OR id IN (
            SELECT student_id
            FROM public.get_assigned_students()
        )
    );
-- Update existing material policies for teachers
DROP POLICY IF EXISTS "Admin can view all materials" ON student_materials;
CREATE POLICY "Teachers can view assigned student materials" ON student_materials FOR
SELECT USING (
        public.is_super_admin()
        OR student_id IN (
            SELECT student_id
            FROM public.get_assigned_students()
        )
    );
DROP POLICY IF EXISTS "Admin can insert materials" ON student_materials;
CREATE POLICY "Teachers can insert materials for assigned students" ON student_materials FOR
INSERT WITH CHECK (
        (
            public.is_super_admin()
            OR (
                public.is_teacher()
                AND (
                    public.get_teacher_permissions()->>'can_manage_materials'
                )::boolean = true
            )
        )
        AND (
            public.is_super_admin()
            OR student_id IN (
                SELECT student_id
                FROM public.get_assigned_students()
            )
        )
    );
DROP POLICY IF EXISTS "Admin can delete materials" ON student_materials;
CREATE POLICY "Teachers can delete materials for assigned students" ON student_materials FOR DELETE USING (
    (
        public.is_super_admin()
        OR (
            public.is_teacher()
            AND (
                public.get_teacher_permissions()->>'can_manage_materials'
            )::boolean = true
        )
    )
    AND (
        public.is_super_admin()
        OR student_id IN (
            SELECT student_id
            FROM public.get_assigned_students()
        )
    )
);
-- Update storage policies for teachers
DROP POLICY IF EXISTS "Admin can manage student materials" ON storage.objects;
CREATE POLICY "Teachers can manage assigned student materials" ON storage.objects FOR ALL USING (
    bucket_id = 'student-materials'
    AND (
        public.is_super_admin()
        OR (
            public.is_teacher()
            AND (
                public.get_teacher_permissions()->>'can_manage_materials'
            )::boolean = true
        )
    )
) WITH CHECK (
    bucket_id = 'student-materials'
    AND (
        public.is_super_admin()
        OR (
            public.is_teacher()
            AND (
                public.get_teacher_permissions()->>'can_manage_materials'
            )::boolean = true
        )
    )
);
-- Grant necessary permissions
GRANT ALL ON teachers TO authenticated;
GRANT ALL ON teachers TO service_role;
-- Set existing students to be assigned to super admin by default
UPDATE students
SET assigned_teacher_id = NULL
WHERE assigned_teacher_id IS NULL;
-- Create a default super admin teacher record (optional, for consistency)
-- This allows grantmatai@gmail.com to appear in teacher lists if needed
-- Insert super admin teacher record using a subquery via auth.users
-- Only runs if the super admin already has a student record
DO $$
DECLARE v_student_id UUID;
v_email TEXT := 'grantmatai@gmail.com';
BEGIN -- Find the student row whose id matches the auth user for this email
SELECT u.id INTO v_student_id
FROM auth.users u
    INNER JOIN students s ON s.id = u.id
WHERE u.email = v_email
LIMIT 1;
IF v_student_id IS NOT NULL THEN
INSERT INTO teachers (student_id, email, is_active, permissions)
VALUES (
        v_student_id,
        v_email,
        true,
        '{"can_manage_blog":true,"can_manage_materials":true,"can_assign_practice":true,"can_view_analytics":true,"can_manage_students":true,"can_upload_videos":true,"can_manage_messages":true}'::jsonb
    ) ON CONFLICT (email) DO
UPDATE
SET is_active = true,
    permissions = '{"can_manage_blog":true,"can_manage_materials":true,"can_assign_practice":true,"can_view_analytics":true,"can_manage_students":true,"can_upload_videos":true,"can_manage_messages":true}'::jsonb;
END IF;
END $$;
-- Backfill new message permission for existing teachers
UPDATE teachers
SET permissions = permissions || '{"can_manage_messages": false}'::jsonb
WHERE NOT (permissions ? 'can_manage_messages');
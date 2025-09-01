-- Complete Student Management Setup Script
-- Run this entire script in your Supabase SQL Editor
-- 1. Create student_materials table
CREATE TABLE IF NOT EXISTS student_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 2. Create student_assignments table
CREATE TABLE IF NOT EXISTS student_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    day TEXT NOT NULL CHECK (
        day IN (
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
            'sunday'
        )
    ),
    day_order INTEGER NOT NULL CHECK (
        day_order >= 1
        AND day_order <= 7
    ),
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 3. Create storage bucket for student materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-materials', 'student-materials', false) ON CONFLICT (id) DO NOTHING;
-- 4. Enable RLS on tables
ALTER TABLE student_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_assignments ENABLE ROW LEVEL SECURITY;
-- 5. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Students can view own materials" ON student_materials;
DROP POLICY IF EXISTS "Admin can view all materials" ON student_materials;
DROP POLICY IF EXISTS "Admin can insert materials" ON student_materials;
DROP POLICY IF EXISTS "Admin can delete materials" ON student_materials;
DROP POLICY IF EXISTS "Students can view own assignments" ON student_assignments;
DROP POLICY IF EXISTS "Students can update own assignments" ON student_assignments;
DROP POLICY IF EXISTS "Admin can manage all assignments" ON student_assignments;
-- 6. Create RLS policies for student_materials
CREATE POLICY "Students can view own materials" ON student_materials FOR
SELECT USING (student_id = auth.uid());
CREATE POLICY "Admin can view all materials" ON student_materials FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'grantmatai@gmail.com'
    )
);
CREATE POLICY "Admin can insert materials" ON student_materials FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM auth.users
            WHERE auth.users.id = auth.uid()
                AND auth.users.email = 'grantmatai@gmail.com'
        )
    );
CREATE POLICY "Admin can delete materials" ON student_materials FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'grantmatai@gmail.com'
    )
);
-- 7. Create RLS policies for student_assignments
CREATE POLICY "Students can view own assignments" ON student_assignments FOR
SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can update own assignments" ON student_assignments FOR
UPDATE USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "Admin can manage all assignments" ON student_assignments FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'grantmatai@gmail.com'
    )
);
-- 8. Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Students can download own materials" ON storage.objects;
DROP POLICY IF EXISTS "Admin can manage student materials" ON storage.objects;
-- 9. Create storage policies
CREATE POLICY "Students can download own materials" ON storage.objects FOR
SELECT USING (
        bucket_id = 'student-materials'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
CREATE POLICY "Admin can manage student materials" ON storage.objects FOR ALL USING (
    bucket_id = 'student-materials'
    AND EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'grantmatai@gmail.com'
    )
);
-- 10. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_materials_student_id ON student_materials(student_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_student_id ON student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_day_order ON student_assignments(student_id, day_order);
-- 11. Create function for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
-- 12. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_student_assignments_updated_at ON student_assignments;
CREATE TRIGGER update_student_assignments_updated_at BEFORE
UPDATE ON student_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Success message
SELECT 'Student management system setup completed successfully!' AS status;
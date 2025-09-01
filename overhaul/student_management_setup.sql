-- Student Management System Database Setup
-- Run these SQL commands in your Supabase SQL editor
-- 1. Create students table (if not exists from auth.users)
-- This assumes you're using Supabase auth users as students
-- If you need a separate students table, uncomment the following:
/*
 CREATE TABLE IF NOT EXISTS students (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
 email TEXT NOT NULL,
 first_name TEXT,
 last_name TEXT,
 phone TEXT,
 notes TEXT,
 created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 );
 */
-- 2. Create student_materials table
CREATE TABLE IF NOT EXISTS student_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 3. Create student_assignments table
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
-- 4. Create storage bucket for student materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-materials', 'student-materials', false) ON CONFLICT (id) DO NOTHING;
-- 5. Set up Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE student_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_assignments ENABLE ROW LEVEL SECURITY;
-- Student Materials RLS Policies
-- Students can only see their own materials
CREATE POLICY "Students can view own materials" ON student_materials FOR
SELECT USING (student_id = auth.uid());
-- Admin can see all materials (replace with your actual admin email)
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
-- Student Assignments RLS Policies
-- Students can view and update their own assignments
CREATE POLICY "Students can view own assignments" ON student_assignments FOR
SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can update own assignments" ON student_assignments FOR
UPDATE USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
-- Admin can manage all assignments
CREATE POLICY "Admin can manage all assignments" ON student_assignments FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'grantmatai@gmail.com'
    )
);
-- 6. Storage policies for student-materials bucket
-- Students can download their own materials
CREATE POLICY "Students can download own materials" ON storage.objects FOR
SELECT USING (
        bucket_id = 'student-materials'
        AND (storage.foldername(name)) [1] = auth.uid()::text
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
-- 7. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_materials_student_id ON student_materials(student_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_student_id ON student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_day_order ON student_assignments(student_id, day_order);
-- 8. Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
-- Create triggers for updated_at
CREATE TRIGGER update_student_assignments_updated_at BEFORE
UPDATE ON student_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- 9. Sample data (optional - for testing)
-- Uncomment to insert sample data
/*
 -- Insert a sample assignment (replace the student_id with an actual user ID)
 INSERT INTO student_assignments (student_id, day, day_order, title, description) VALUES
 ('YOUR_STUDENT_USER_ID_HERE', 'monday', 1, 'Practice Scales', 'Practice C major scale for 15 minutes'),
 ('YOUR_STUDENT_USER_ID_HERE', 'wednesday', 3, 'Chord Practice', 'Work on G, C, and D chord transitions'),
 ('YOUR_STUDENT_USER_ID_HERE', 'friday', 5, 'Song Practice', 'Practice "Wonderwall" - focus on strumming pattern');
 */
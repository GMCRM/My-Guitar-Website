-- Quick setup for student_materials table
-- Run this if the table doesn't exist
-- Create student_materials table
CREATE TABLE IF NOT EXISTS student_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE student_materials ENABLE ROW LEVEL SECURITY;
-- Create basic policies
DROP POLICY IF EXISTS "Admin can manage all materials" ON student_materials;
CREATE POLICY "Admin can manage all materials" ON student_materials FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'grantmatai@gmail.com'
    )
);
-- Verify table was created
SELECT table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'student_materials'
ORDER BY ordinal_position;
-- Guitar Practice Leaderboard Setup
-- Creates students table for leaderboard opt-in management
-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    leaderboard_opt_in BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create index for faster opt-in queries
CREATE INDEX IF NOT EXISTS idx_students_opt_in ON students(leaderboard_opt_in)
WHERE leaderboard_opt_in = true;
-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- Policy: Students can view their own record
CREATE POLICY "Students can view own record" ON students FOR
SELECT USING (auth.uid() = id);
-- Policy: Admin service role can insert/update all records
CREATE POLICY "Admin can manage all records" ON students FOR ALL USING (true) WITH CHECK (true);
-- Backfill existing students from auth.users
INSERT INTO students (id, leaderboard_opt_in)
SELECT id,
    false
FROM auth.users
WHERE id NOT IN (
        SELECT id
        FROM students
    ) ON CONFLICT (id) DO NOTHING;
-- Create function to automatically create student record when auth user is created
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO students (id, leaderboard_opt_in)
VALUES (NEW.id, false) ON CONFLICT (id) DO NOTHING;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Create trigger to execute function on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
-- Update timestamp function (optional but good practice)
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at BEFORE
UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
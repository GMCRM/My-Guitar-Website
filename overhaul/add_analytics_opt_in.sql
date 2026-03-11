-- Add analytics opt-in column to students table
-- This controls whether a student appears in the admin analytics tab

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS analytics_opt_in BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster opt-in queries
CREATE INDEX IF NOT EXISTS idx_students_analytics_opt_in ON students(analytics_opt_in)
WHERE analytics_opt_in = true;

-- Update existing students to opt-in by default (or set to false if you want manual opt-in)
-- Comment out the line below if you want students to manually opt-in
UPDATE students SET analytics_opt_in = true WHERE analytics_opt_in = false;

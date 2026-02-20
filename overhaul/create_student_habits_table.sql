-- Create student_habits table for tracking daily practice
-- Each row represents one day a student marked as practiced
-- Toggling removes the row; presence of a row = practiced that day
CREATE TABLE student_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, date)
);
-- Index for efficient queries by student and date range
CREATE INDEX idx_student_habits_student_date ON student_habits(student_id, date);
-- Enable Row Level Security
ALTER TABLE student_habits ENABLE ROW LEVEL SECURITY;
-- RLS Policies
-- Students can view their own habits
CREATE POLICY "Students can view own habits" ON student_habits FOR
SELECT USING (auth.uid() = student_id);
-- Students can insert their own habits
CREATE POLICY "Students can insert own habits" ON student_habits FOR
INSERT WITH CHECK (auth.uid() = student_id);
-- Students can delete their own habits
CREATE POLICY "Students can delete own habits" ON student_habits FOR DELETE USING (auth.uid() = student_id);
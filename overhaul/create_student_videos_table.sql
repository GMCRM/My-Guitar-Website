-- Create student_videos table for individual student video assignments
CREATE TABLE IF NOT EXISTS student_videos (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    youtube_id VARCHAR(255) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_videos_student_id ON student_videos(student_id);
CREATE INDEX IF NOT EXISTS idx_student_videos_created_at ON student_videos(created_at);
-- Enable Row Level Security
ALTER TABLE student_videos ENABLE ROW LEVEL SECURITY;
-- Create policies
-- Students can only view their own videos
CREATE POLICY "Students can view own videos" ON student_videos FOR
SELECT USING (auth.uid() = student_id);
-- Admin can view all videos (for admin email)
CREATE POLICY "Admin can view all videos" ON student_videos FOR
SELECT USING (auth.jwt()->>'email' = 'grantmatai@gmail.com');
-- Admin can insert videos for any student
CREATE POLICY "Admin can insert videos" ON student_videos FOR
INSERT WITH CHECK (auth.jwt()->>'email' = 'grantmatai@gmail.com');
-- Admin can update any video
CREATE POLICY "Admin can update videos" ON student_videos FOR
UPDATE USING (auth.jwt()->>'email' = 'grantmatai@gmail.com');
-- Admin can delete any video
CREATE POLICY "Admin can delete videos" ON student_videos FOR DELETE USING (auth.jwt()->>'email' = 'grantmatai@gmail.com');
-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
CREATE TRIGGER update_student_videos_updated_at BEFORE
UPDATE ON student_videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
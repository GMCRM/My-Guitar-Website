-- ============================================================
-- Guitar Practice Feature — Database Setup
-- Run this in your Supabase SQL Editor
-- ============================================================
-- 1. backing_tracks — global list of backing tracks (managed by admin)
CREATE TABLE IF NOT EXISTS backing_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE backing_tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view backing tracks" ON backing_tracks FOR
SELECT USING (true);
CREATE POLICY "Admin can manage backing tracks" ON backing_tracks FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'grantmatai@gmail.com'
    )
);
-- 2. strumming_patterns — global list of strumming patterns
CREATE TABLE IF NOT EXISTS strumming_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    pattern_string TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE strumming_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view strumming patterns" ON strumming_patterns FOR
SELECT USING (true);
CREATE POLICY "Admin can manage strumming patterns" ON strumming_patterns FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'grantmatai@gmail.com'
    )
);
-- 3. musical_keys — global list of musical keys with I-IV-V progressions
CREATE TABLE IF NOT EXISTS musical_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_name TEXT NOT NULL,
    chord_i TEXT NOT NULL,
    chord_iv TEXT NOT NULL,
    chord_v TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE musical_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view musical keys" ON musical_keys FOR
SELECT USING (true);
CREATE POLICY "Admin can manage musical keys" ON musical_keys FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'grantmatai@gmail.com'
    )
);
-- 4. student_backing_tracks — join table assigning tracks to students
CREATE TABLE IF NOT EXISTS student_backing_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES backing_tracks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, track_id)
);
ALTER TABLE student_backing_tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own backing tracks" ON student_backing_tracks FOR
SELECT USING (auth.uid() = student_id);
CREATE POLICY "Admin can manage student backing tracks" ON student_backing_tracks FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'grantmatai@gmail.com'
    )
);
CREATE INDEX IF NOT EXISTS idx_student_backing_tracks_student_id ON student_backing_tracks(student_id);
-- 5. student_strumming_patterns — join table assigning patterns to students
CREATE TABLE IF NOT EXISTS student_strumming_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pattern_id UUID NOT NULL REFERENCES strumming_patterns(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, pattern_id)
);
ALTER TABLE student_strumming_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own strumming patterns" ON student_strumming_patterns FOR
SELECT USING (auth.uid() = student_id);
CREATE POLICY "Admin can manage student strumming patterns" ON student_strumming_patterns FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'grantmatai@gmail.com'
    )
);
CREATE INDEX IF NOT EXISTS idx_student_strumming_patterns_student_id ON student_strumming_patterns(student_id);
-- 6. student_musical_keys — join table assigning keys to students
CREATE TABLE IF NOT EXISTS student_musical_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    key_id UUID NOT NULL REFERENCES musical_keys(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, key_id)
);
ALTER TABLE student_musical_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own musical keys" ON student_musical_keys FOR
SELECT USING (auth.uid() = student_id);
CREATE POLICY "Admin can manage student musical keys" ON student_musical_keys FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'grantmatai@gmail.com'
    )
);
CREATE INDEX IF NOT EXISTS idx_student_musical_keys_student_id ON student_musical_keys(student_id);
-- ============================================================
-- Storage bucket for backing track audio files
-- ============================================================
-- Run this in the Supabase SQL Editor or create via dashboard:
INSERT INTO storage.buckets (id, name, public)
VALUES ('backing-tracks', 'backing-tracks', true) ON CONFLICT (id) DO NOTHING;
-- Allow public read access to backing track audio
CREATE POLICY "Public read access for backing tracks" ON storage.objects FOR
SELECT USING (bucket_id = 'backing-tracks');
-- Allow admin to upload/delete backing track audio
CREATE POLICY "Admin can upload backing tracks" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'backing-tracks'
        AND EXISTS (
            SELECT 1
            FROM auth.users
            WHERE auth.users.id = auth.uid()
                AND auth.users.email = 'grantmatai@gmail.com'
        )
    );
CREATE POLICY "Admin can delete backing tracks" ON storage.objects FOR DELETE USING (
    bucket_id = 'backing-tracks'
    AND EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'grantmatai@gmail.com'
    )
);
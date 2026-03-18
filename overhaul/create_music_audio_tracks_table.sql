-- Create music_audio_tracks table for public music page audio managed by admin
CREATE TABLE IF NOT EXISTS public.music_audio_tracks (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    public_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_music_audio_tracks_display_order ON public.music_audio_tracks(display_order);
CREATE INDEX IF NOT EXISTS idx_music_audio_tracks_created_at ON public.music_audio_tracks(created_at);
ALTER TABLE public.music_audio_tracks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view music audio tracks" ON public.music_audio_tracks;
CREATE POLICY "Public can view music audio tracks" ON public.music_audio_tracks FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage music audio tracks" ON public.music_audio_tracks;
CREATE POLICY "Admin can manage music audio tracks" ON public.music_audio_tracks FOR ALL USING (auth.jwt()->>'email' = 'grantmatai@gmail.com') WITH CHECK (auth.jwt()->>'email' = 'grantmatai@gmail.com');
CREATE OR REPLACE FUNCTION public.update_music_audio_tracks_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_music_audio_tracks_updated_at ON public.music_audio_tracks;
CREATE TRIGGER trg_music_audio_tracks_updated_at BEFORE
UPDATE ON public.music_audio_tracks FOR EACH ROW EXECUTE FUNCTION public.update_music_audio_tracks_updated_at();
-- Public storage bucket for music audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('music-audio', 'music-audio', true) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Public can read music audio files" ON storage.objects;
CREATE POLICY "Public can read music audio files" ON storage.objects FOR
SELECT USING (bucket_id = 'music-audio');
DROP POLICY IF EXISTS "Admin can upload music audio files" ON storage.objects;
CREATE POLICY "Admin can upload music audio files" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'music-audio'
        AND auth.jwt()->>'email' = 'grantmatai@gmail.com'
    );
DROP POLICY IF EXISTS "Admin can delete music audio files" ON storage.objects;
CREATE POLICY "Admin can delete music audio files" ON storage.objects FOR DELETE USING (
    bucket_id = 'music-audio'
    AND auth.jwt()->>'email' = 'grantmatai@gmail.com'
);
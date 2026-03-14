-- Create music_videos table for public music page videos managed by admin
CREATE TABLE IF NOT EXISTS public.music_videos (
    id BIGSERIAL PRIMARY KEY,
    youtube_id VARCHAR(255) NOT NULL UNIQUE,
    title TEXT NOT NULL,
    author_name TEXT,
    thumbnail_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_music_videos_display_order ON public.music_videos(display_order);
CREATE INDEX IF NOT EXISTS idx_music_videos_created_at ON public.music_videos(created_at);
ALTER TABLE public.music_videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view music videos" ON public.music_videos;
CREATE POLICY "Public can view music videos" ON public.music_videos FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage music videos" ON public.music_videos;
CREATE POLICY "Admin can manage music videos" ON public.music_videos FOR ALL USING (auth.jwt()->>'email' = 'grantmatai@gmail.com') WITH CHECK (auth.jwt()->>'email' = 'grantmatai@gmail.com');
CREATE OR REPLACE FUNCTION public.update_music_videos_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_music_videos_updated_at ON public.music_videos;
CREATE TRIGGER trg_music_videos_updated_at BEFORE
UPDATE ON public.music_videos FOR EACH ROW EXECUTE FUNCTION public.update_music_videos_updated_at();
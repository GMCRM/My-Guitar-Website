
-- Add image_url column to blog_posts table
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image_url text;


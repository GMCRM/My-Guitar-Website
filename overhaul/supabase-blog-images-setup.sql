-- Database setup for blog images
-- Run this in your Supabase SQL editor
-- Add image_url column to blog_posts table
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS image_url text;
-- Create storage bucket for blog images (run in Supabase dashboard -> Storage)
-- Bucket name: blog-images
-- Public: true
-- File size limit: 10MB
-- Allowed MIME types: image/*
-- Storage policies (run in SQL editor after creating bucket)
-- Policy for public read access
CREATE POLICY "Blog images are publicly accessible" ON storage.objects FOR
SELECT USING (bucket_id = 'blog-images');
-- Policy for authenticated upload
CREATE POLICY "Authenticated users can upload blog images" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'blog-images'
        AND auth.role() = 'authenticated'
    );
-- Policy for authenticated update
CREATE POLICY "Authenticated users can update blog images" ON storage.objects FOR
UPDATE USING (
        bucket_id = 'blog-images'
        AND auth.role() = 'authenticated'
    );
-- Policy for authenticated delete
CREATE POLICY "Authenticated users can delete blog images" ON storage.objects FOR DELETE USING (
    bucket_id = 'blog-images'
    AND auth.role() = 'authenticated'
);
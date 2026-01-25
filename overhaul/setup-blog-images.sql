-- Blog Images Storage Setup
-- Run this in your Supabase SQL Editor to set up blog image storage
-- 1. First, make sure blog_posts table has image_url column
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS image_url text;
-- 2. Create storage bucket for blog images (this might fail if bucket already exists - that's OK)
INSERT INTO storage.buckets (
        id,
        name,
        public,
        file_size_limit,
        allowed_mime_types
    )
VALUES (
        'blog-images',
        'blog-images',
        true,
        10485760,
        -- 10MB in bytes
        ARRAY ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    ) ON CONFLICT (id) DO NOTHING;
-- 3. Enable Row Level Security on storage.objects (should already be enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
-- 4. Create policies for blog images storage
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Blog images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete blog images" ON storage.objects;
-- Policy for public read access to blog images
CREATE POLICY "Blog images are publicly accessible" ON storage.objects FOR
SELECT USING (bucket_id = 'blog-images');
-- Policy for admin upload
CREATE POLICY "Admin can upload blog images" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'blog-images'
        AND (
            auth.jwt()->>'email' = 'grantmatai@gmail.com'
            OR auth.role() = 'service_role'
        )
    );
-- Policy for admin update
CREATE POLICY "Admin can update blog images" ON storage.objects FOR
UPDATE USING (
        bucket_id = 'blog-images'
        AND (
            auth.jwt()->>'email' = 'grantmatai@gmail.com'
            OR auth.role() = 'service_role'
        )
    );
-- Policy for admin delete
CREATE POLICY "Admin can delete blog images" ON storage.objects FOR DELETE USING (
    bucket_id = 'blog-images'
    AND (
        auth.jwt()->>'email' = 'grantmatai@gmail.com'
        OR auth.role() = 'service_role'
    )
);
-- 5. Verify setup
SELECT 'Blog images storage setup complete' as status,
    'Bucket: ' || name as bucket_info,
    'Public: ' || public::text as public_access,
    'File limit: ' || (file_size_limit / 1024 / 1024)::text || 'MB' as size_limit
FROM storage.buckets
WHERE id = 'blog-images';
-- Check that image_url column exists
SELECT 'blog_posts table ready' as table_status,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'blog_posts'
    AND column_name = 'image_url';
-- List storage policies for blog-images bucket
SELECT 'Storage policies:' as info,
    policyname,
    cmd,
    permissive
FROM pg_policies
WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND (
        policyname LIKE '%blog%'
        OR policyname LIKE '%Blog%'
    );
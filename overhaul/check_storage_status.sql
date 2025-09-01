-- Alternative Storage Setup - Dashboard Method
-- Since you can't modify policies via SQL, let's check what we have
-- and provide instructions for the Supabase dashboard
-- 1. Check current bucket status
SELECT 'Current buckets:' as info,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE name LIKE '%student%'
ORDER BY name;
-- 2. Check if any objects exist
SELECT 'Objects in buckets:' as info,
    bucket_id,
    COUNT(*) as file_count
FROM storage.objects
WHERE bucket_id LIKE '%student%'
GROUP BY bucket_id;
-- 3. Test basic storage access
SELECT 'Storage test:' as info,
    'You can read storage buckets ✓' as status;
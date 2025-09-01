-- Check if student management tables and storage exist
-- Run this in Supabase SQL Editor to see what needs to be created
-- 1. Check if student_materials table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name = 'student_materials';
-- 2. Check if student_assignments table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name = 'student_assignments';
-- 3. Check if student-materials storage bucket exists
SELECT *
FROM storage.buckets
WHERE id = 'student-materials';
-- 4. Check existing RLS policies for student_materials
SELECT schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'student_materials';
-- 5. Check existing RLS policies for student_assignments  
SELECT schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'student_assignments';
-- 6. Check storage policies
SELECT bucket_id,
    name,
    definition
FROM storage.policies
WHERE bucket_id = 'student-materials';
-- Incremental patch for existing teacher-management deployments
-- Safe to run after create_teachers_system.sql was already executed
BEGIN;
-- 1) Ensure teachers.permissions default includes can_manage_messages
ALTER TABLE IF EXISTS public.teachers
ALTER COLUMN permissions
SET DEFAULT '{
  "can_manage_blog": false,
  "can_manage_materials": true,
  "can_assign_practice": true,
  "can_view_analytics": true,
  "can_manage_students": false,
  "can_upload_videos": false,
  "can_manage_messages": false
}'::jsonb;
-- 2) Refresh get_teacher_permissions() to include can_manage_messages for super admin
CREATE OR REPLACE FUNCTION public.get_teacher_permissions() RETURNS JSONB AS $$
DECLARE teacher_perms JSONB;
BEGIN IF public.is_super_admin() THEN RETURN '{
      "can_manage_blog": true,
      "can_manage_materials": true,
      "can_assign_practice": true,
      "can_view_analytics": true,
      "can_manage_students": true,
      "can_upload_videos": true,
      "can_manage_messages": true
    }'::jsonb;
END IF;
SELECT permissions INTO teacher_perms
FROM public.teachers
WHERE email = auth.email()
    AND is_active = true;
RETURN COALESCE(teacher_perms, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 3) Backfill missing permission key for existing teacher records
UPDATE public.teachers
SET permissions = COALESCE(permissions, '{}'::jsonb) || '{"can_manage_messages": false}'::jsonb
WHERE NOT (
        COALESCE(permissions, '{}'::jsonb) ? 'can_manage_messages'
    );
-- 4) Keep super admin explicitly fully enabled (including can_manage_messages)
UPDATE public.teachers
SET is_active = true,
    permissions = COALESCE(permissions, '{}'::jsonb) || '{
      "can_manage_blog": true,
      "can_manage_materials": true,
      "can_assign_practice": true,
      "can_view_analytics": true,
      "can_manage_students": true,
      "can_upload_videos": true,
      "can_manage_messages": true
    }'::jsonb
WHERE email = 'grantmatai@gmail.com';
COMMIT;
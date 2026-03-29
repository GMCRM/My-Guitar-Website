-- Add per-teacher toggle to allow assigned-student selector mode in the student portal.
ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS allow_portal_student_selector BOOLEAN NOT NULL DEFAULT false;

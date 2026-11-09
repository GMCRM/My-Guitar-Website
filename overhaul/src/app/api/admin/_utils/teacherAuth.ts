import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

export type PermissionKey =
  | 'can_manage_blog'
  | 'can_manage_materials'
  | 'can_assign_practice'
  | 'can_view_analytics'
  | 'can_manage_students'
  | 'can_upload_videos'
  | 'can_manage_messages';

export type TeacherPermissions = Record<PermissionKey, boolean>;

export const SUPER_ADMIN_EMAIL = 'grantmatai@gmail.com';

const ALL_PERMISSIONS: TeacherPermissions = {
  can_manage_blog: true,
  can_manage_materials: true,
  can_assign_practice: true,
  can_view_analytics: true,
  can_manage_students: true,
  can_upload_videos: true,
  can_manage_messages: true
};

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export interface ActorContext {
  email: string;
  isSuperAdmin: boolean;
  teacherId: string | null;
  teacherStudentId: string | null;
  allowPortalStudentSelector: boolean;
  permissions: TeacherPermissions;
}

const normalizePermissions = (permissions: any): TeacherPermissions => ({
  can_manage_blog: Boolean(permissions?.can_manage_blog),
  can_manage_materials: Boolean(permissions?.can_manage_materials),
  can_assign_practice: Boolean(permissions?.can_assign_practice),
  can_view_analytics: Boolean(permissions?.can_view_analytics),
  can_manage_students: Boolean(permissions?.can_manage_students),
  can_upload_videos: Boolean(permissions?.can_upload_videos),
  can_manage_messages: Boolean(permissions?.can_manage_messages)
});

/** The signed-in user, proven by the Supabase token on this request. */
export async function getVerifiedUser(): Promise<{ id: string; email: string } | null> {
  const authorization = (await headers()).get('authorization');
  const token = authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) {
    return null;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user?.email) {
    return null;
  }

  return { id: data.user.id, email: data.user.email };
}

/**
 * Permissions of the verified caller. Any email passed by a route is ignored,
 * because it comes from the browser and can be forged.
 */
export async function resolveActorContext(_claimedEmail?: string | null): Promise<ActorContext | null> {
  const user = await getVerifiedUser();
  if (!user) {
    return null;
  }

  const userEmail = user.email;

  if (userEmail === SUPER_ADMIN_EMAIL) {
    return {
      email: userEmail,
      isSuperAdmin: true,
      teacherId: null,
      teacherStudentId: null,
      allowPortalStudentSelector: true,
      permissions: ALL_PERMISSIONS
    };
  }

  const { data: teacher, error } = await supabaseAdmin
    .from('teachers')
    .select('id, student_id, permissions, allow_portal_student_selector')
    .eq('email', userEmail)
    .eq('is_active', true)
    .single();

  if (error || !teacher) {
    return null;
  }

  return {
    email: userEmail,
    isSuperAdmin: false,
    teacherId: teacher.id,
    teacherStudentId: teacher.student_id,
    allowPortalStudentSelector: Boolean(teacher.allow_portal_student_selector),
    permissions: normalizePermissions(teacher.permissions)
  };
}

export async function getAccessibleStudentIds(actor: ActorContext): Promise<Set<string>> {
  if (actor.isSuperAdmin) {
    const { data: rows } = await supabaseAdmin
      .from('students')
      .select('id');

    return new Set((rows || []).map((row: any) => row.id));
  }

  const { data: assigned } = await supabaseAdmin
    .from('students')
    .select('id')
    .eq('assigned_teacher_id', actor.teacherId);

  const accessible = new Set((assigned || []).map((row: any) => row.id));
  if (actor.teacherStudentId) {
    accessible.add(actor.teacherStudentId);
  }

  return accessible;
}

export async function canAccessStudent(
  actor: ActorContext,
  studentId: string,
  options: { requireManageStudentsForAssigned?: boolean } = {}
): Promise<boolean> {
  if (actor.isSuperAdmin) {
    return true;
  }

  if (actor.teacherStudentId === studentId) {
    return true;
  }

  if (options.requireManageStudentsForAssigned && !actor.permissions.can_manage_students) {
    return false;
  }

  const { data: student, error } = await supabaseAdmin
    .from('students')
    .select('assigned_teacher_id')
    .eq('id', studentId)
    .single();

  if (error || !student) {
    return false;
  }

  return student.assigned_teacher_id === actor.teacherId;
}

export async function isVerifiedSuperAdmin(): Promise<boolean> {
  const actor = await resolveActorContext();
  return Boolean(actor?.isSuperAdmin);
}

/** True for the student themselves, or a teacher or admin with access to that student. */
export async function canActForStudent(studentId: string): Promise<boolean> {
  const user = await getVerifiedUser();
  if (!user) {
    return false;
  }
  if (user.id === studentId) {
    return true;
  }

  const actor = await resolveActorContext();
  return Boolean(actor && (await canAccessStudent(actor, studentId)));
}

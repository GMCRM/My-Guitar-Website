import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type { Teacher, TeacherPermissions, Student } from '@/lib/supabase';

// Create a service role client for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// GET - Fetch all teachers and their assigned students
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    // Verify super admin access
    if (userEmail !== 'grantmatai@gmail.com') {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      );
    }

    // Fetch all teachers
    const { data: teachers, error: teachersError } = await supabaseAdmin
      .from('teachers')
      .select('*')
      .order('created_at', { ascending: false });

    if (teachersError) {
      console.error('Error fetching teachers:', teachersError);
      return NextResponse.json(
        { error: 'Failed to fetch teachers' },
        { status: 500 }
      );
    }

    // Fetch all auth users to get name/email
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Build a map of user id -> {email, name}
    const userMap = new Map(
      usersData.users.map((u) => [
        u.id,
        {
          id: u.id,
          email: u.email ?? '',
          name: (`${u.user_metadata?.first_name ?? ''} ${u.user_metadata?.last_name ?? ''}`.trim()) || (u.email ?? '')
        }
      ])
    );

    // Fetch all students (just ids and assignment data)
    const { data: studentsRows } = await supabaseAdmin
      .from('students')
      .select('id, assigned_teacher_id');

    // Enrich teachers with user info and assigned students
    const teachersWithStudents = (teachers || []).map((teacher: any) => {
      const userInfo = userMap.get(teacher.student_id) ?? { id: teacher.student_id, email: teacher.email, name: teacher.email };

      const assignedStudentIds = (studentsRows || [])
        .filter((s: any) => s.assigned_teacher_id === teacher.id)
        .map((s: any) => s.id);

      const assignedStudents = assignedStudentIds
        .map((sid: string) => userMap.get(sid))
        .filter(Boolean);

      return {
        ...teacher,
        student: userInfo,
        assignedStudents
      };
    });

    // Build allStudents list from auth users that have a student row
    const studentIds = new Set((studentsRows || []).map((s: any) => s.id));
    const allStudents = usersData.users
      .filter((u) => studentIds.has(u.id))
      .map((u) => ({
        id: u.id,
        email: u.email ?? '',
        name: (`${u.user_metadata?.first_name ?? ''} ${u.user_metadata?.last_name ?? ''}`.trim()) || (u.email ?? ''),
        assigned_teacher_id: (studentsRows || []).find((s: any) => s.id === u.id)?.assigned_teacher_id ?? null
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      teachers: teachersWithStudents,
      allStudents
    });

  } catch (error) {
    console.error('Teachers API GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Promote a student to teacher
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail, studentId, permissions } = body;

    // Verify super admin access
    if (userEmail !== 'grantmatai@gmail.com') {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      );
    }

    if (!studentId || !permissions) {
      return NextResponse.json(
        { error: 'Missing required fields: studentId, permissions' },
        { status: 400 }
      );
    }

    // Get student info from auth.users
    const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(studentId);

    if (authUserError || !authUser?.user) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const student = {
      id: authUser.user.id,
      email: authUser.user.email ?? '',
      name: (`${authUser.user.user_metadata?.first_name ?? ''} ${authUser.user.user_metadata?.last_name ?? ''}`.trim()) || (authUser.user.email ?? '')
    };

    // Verify they have a student row
    const { data: studentRow, error: studentRowError } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('id', studentId)
      .single();

    if (studentRowError || !studentRow) {
      return NextResponse.json(
        { error: 'User does not have a student account' },
        { status: 404 }
      );
    }

    // Check if student is already a teacher
    const { data: existingTeacher } = await supabaseAdmin
      .from('teachers')
      .select('id')
      .eq('email', student.email)
      .single();

    if (existingTeacher) {
      return NextResponse.json(
        { error: 'Student is already a teacher' },
        { status: 400 }
      );
    }

    // Create teacher record
    const { data: newTeacher, error: teacherError } = await supabaseAdmin
      .from('teachers')
      .insert({
        student_id: studentId,
        email: student.email,
        is_active: true,
        permissions: permissions,
        allow_portal_student_selector: false
      })
      .select()
      .single();

    if (teacherError) {
      console.error('Error creating teacher:', teacherError);
      return NextResponse.json(
        { error: `Failed to create teacher: ${teacherError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      teacher: {
        ...newTeacher,
        student: student,
        assignedStudents: []
      }
    });

  } catch (error) {
    console.error('Teachers API POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update teacher permissions or student assignments
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail, teacherId, permissions, studentAssignments, allowPortalStudentSelector, action } = body;

    // Verify super admin access (only super admin can modify teachers)
    if (userEmail !== 'grantmatai@gmail.com') {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      );
    }

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Missing teacherId' },
        { status: 400 }
      );
    }

    // Verify teacher exists
    const { data: teacher, error: teacherError } = await supabaseAdmin
      .from('teachers')
      .select('*')
      .eq('id', teacherId)
      .single();

    if (teacherError || !teacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Prevent modifying super admin
    if (teacher.email === 'grantmatai@gmail.com') {
      return NextResponse.json(
        { error: 'Cannot modify super admin' },
        { status: 403 }
      );
    }

    // Update permissions if provided
    if (permissions && action === 'updatePermissions') {
      const { error: updateError } = await supabaseAdmin
        .from('teachers')
        .update({ permissions })
        .eq('id', teacherId);

      if (updateError) {
        console.error('Error updating teacher permissions:', updateError);
        return NextResponse.json(
          { error: 'Failed to update permissions' },
          { status: 500 }
        );
      }
    }

    // Update student assignments if provided
    if (studentAssignments && action === 'updateAssignments') {
      // First, unassign all current students from this teacher
      await supabaseAdmin
        .from('students')
        .update({ assigned_teacher_id: null })
        .eq('assigned_teacher_id', teacherId);

      // Then assign the new students
      if (studentAssignments.length > 0) {
        const { error: assignError } = await supabaseAdmin
          .from('students')
          .update({ assigned_teacher_id: teacherId })
          .in('id', studentAssignments);

        if (assignError) {
          console.error('Error updating student assignments:', assignError);
          return NextResponse.json(
            { error: 'Failed to update student assignments' },
            { status: 500 }
          );
        }
      }
    }

    // Update portal selector access toggle if provided
    if (action === 'updatePortalSelectorAccess' && typeof allowPortalStudentSelector === 'boolean') {
      const { error: updateSelectorError } = await supabaseAdmin
        .from('teachers')
        .update({ allow_portal_student_selector: allowPortalStudentSelector })
        .eq('id', teacherId);

      if (updateSelectorError) {
        console.error('Error updating teacher portal selector access:', updateSelectorError);
        return NextResponse.json(
          { error: 'Failed to update portal selector access' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Teacher updated successfully'
    });

  } catch (error) {
    console.error('Teachers API PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Demote teacher (reassign students to super admin)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    const teacherId = searchParams.get('teacherId');

    // Verify super admin access
    if (userEmail !== 'grantmatai@gmail.com') {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      );
    }

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Missing teacherId' },
        { status: 400 }
      );
    }

    // Get teacher info
    const { data: teacher } = await supabaseAdmin
      .from('teachers')
      .select('email')
      .eq('id', teacherId)
      .single();

    // Prevent deleting super admin
    if (teacher?.email === 'grantmatai@gmail.com') {
      return NextResponse.json(
        { error: 'Cannot demote super admin' },
        { status: 403 }
      );
    }

    // Reassign all students to super admin (unassign them, since super admin sees all)
    await supabaseAdmin
      .from('students')
      .update({ assigned_teacher_id: null })
      .eq('assigned_teacher_id', teacherId);

    // Delete teacher record
    const { error: deleteError } = await supabaseAdmin
      .from('teachers')
      .delete()
      .eq('id', teacherId);

    if (deleteError) {
      console.error('Error deleting teacher:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete teacher' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Teacher demoted successfully, students reassigned to super admin'
    });

  } catch (error) {
    console.error('Teachers API DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
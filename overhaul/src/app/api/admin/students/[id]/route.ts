import { NextRequest, NextResponse } from 'next/server';
import { canAccessStudent, resolveActorContext, supabaseAdmin } from '../../_utils/teacherAuth';

// PUT - Update student
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { email, firstName, lastName, password, userEmail } = await request.json();
    const studentId = params.id;

    const actor = await resolveActorContext(userEmail);
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized - Teacher access required' }, { status: 403 });
    }

    const hasAccess = await canAccessStudent(actor, studentId, { requireManageStudentsForAssigned: true });
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized - You can only edit your profile or assigned students' }, { status: 403 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {
      email,
      user_metadata: {
        first_name: firstName || '',
        last_name: lastName || ''
      }
    };

    // Add password to update if provided
    if (password && password.trim() !== '') {
      updateData.password = password;
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      studentId,
      updateData
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ user: data.user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete student
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;

    const userEmail = request.nextUrl.searchParams.get('userEmail');
    const actor = await resolveActorContext(userEmail);
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized - Teacher access required' }, { status: 403 });
    }

    if (!actor.isSuperAdmin && actor.teacherStudentId === studentId) {
      return NextResponse.json({ error: 'You cannot delete your own account from this panel' }, { status: 403 });
    }

    const hasAccess = await canAccessStudent(actor, studentId, { requireManageStudentsForAssigned: true });
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized - You can only delete assigned students' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(studentId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { canAccessStudent, resolveActorContext, supabaseAdmin } from '../../../_utils/teacherAuth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    const body = await request.json();
    const { class_total_included, userEmail } = body;

    const actor = await resolveActorContext(userEmail);
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized - Teacher access required' }, { status: 403 });
    }

    const hasAccess = await canAccessStudent(actor, studentId, { requireManageStudentsForAssigned: true });
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only update your profile or assigned students' },
        { status: 403 }
      );
    }

    if (typeof class_total_included !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid input: class_total_included must be a boolean' },
        { status: 400 }
      );
    }

    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(studentId);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('students')
      .upsert(
        {
          id: studentId,
          class_total_included: class_total_included,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'id'
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error updating class total inclusion:', error);
      return NextResponse.json(
        { error: 'Failed to update class total inclusion setting' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      student_id: studentId,
      class_total_included: data.class_total_included
    });

  } catch (error) {
    console.error('Unexpected error in class total inclusion toggle API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

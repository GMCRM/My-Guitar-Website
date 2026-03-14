import { NextRequest, NextResponse } from 'next/server';
import { canAccessStudent, resolveActorContext, supabaseAdmin } from '../../../_utils/teacherAuth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    const body = await request.json();
    const { leaderboard_opt_in, userEmail } = body;

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

    console.log('PATCH leaderboard opt-in for student:', studentId, 'to:', leaderboard_opt_in);

    // Validate input
    if (typeof leaderboard_opt_in !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid input: leaderboard_opt_in must be a boolean' },
        { status: 400 }
      );
    }

    // Verify student exists
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(studentId);

    if (userError || !user) {
      console.error('Student not found:', userError);
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Upsert student record with opt-in setting
    const { data, error } = await supabaseAdmin
      .from('students')
      .upsert(
        {
          id: studentId,
          leaderboard_opt_in: leaderboard_opt_in,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'id'
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error updating leaderboard opt-in:', error);
      return NextResponse.json(
        { error: 'Failed to update leaderboard opt-in setting' },
        { status: 500 }
      );
    }

    console.log('Successfully updated opt-in:', data);
    return NextResponse.json({
      success: true,
      student_id: studentId,
      leaderboard_opt_in: data.leaderboard_opt_in
    });

  } catch (error) {
    console.error('Unexpected error in leaderboard toggle API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

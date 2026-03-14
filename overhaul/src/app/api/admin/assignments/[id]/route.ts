import { NextRequest, NextResponse } from 'next/server';
import { canAccessStudent, resolveActorContext, supabaseAdmin } from '../../_utils/teacherAuth';

// DELETE - Delete an assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    const actor = await resolveActorContext(userEmail);
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!actor.isSuperAdmin && !actor.permissions.can_assign_practice) {
      return NextResponse.json({ error: 'Unauthorized - Practice assignment permission required' }, { status: 403 });
    }

    const assignmentId = params.id;

    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('student_assignments')
      .select('id, student_id')
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const hasAccess = await canAccessStudent(actor, assignment.student_id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized - You can only delete assignments for assigned students' }, { status: 403 });
    }

    // Delete from database
    const { error: dbError } = await supabaseAdmin
      .from('student_assignments')
      .delete()
      .eq('id', assignmentId);

    if (dbError) {
      console.error('Error deleting assignment from database:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    console.log('Admin API: Assignment deleted successfully:', assignmentId);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Admin API: Error deleting assignment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

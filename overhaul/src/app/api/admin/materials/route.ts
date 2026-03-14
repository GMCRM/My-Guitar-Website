import { NextRequest, NextResponse } from 'next/server';
import { canAccessStudent, resolveActorContext, supabaseAdmin } from '../_utils/teacherAuth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const userEmail = searchParams.get('userEmail');

    const actor = await resolveActorContext(userEmail);
    if (!actor) {
      return NextResponse.json(
        { error: 'Unauthorized - Teacher access required' },
        { status: 403 }
      );
    }

    if (!actor.isSuperAdmin && !actor.permissions.can_manage_materials) {
      return NextResponse.json(
        { error: 'Unauthorized - Material management permission required' },
        { status: 403 }
      );
    }

    if (!studentId) {
      return NextResponse.json(
        { error: 'Missing student ID' },
        { status: 400 }
      );
    }

    const hasAccess = await canAccessStudent(actor, studentId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only view materials for assigned students' },
        { status: 403 }
      );
    }

    console.log('Admin API: Loading materials for student:', studentId);

    // Get student materials using service role (bypasses RLS)
    const { data: materials, error: materialsError } = await supabaseAdmin
      .from('student_materials')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (materialsError) {
      console.error('Admin API: Materials query error:', materialsError);
      return NextResponse.json(
        { error: `Database error: ${materialsError.message}` },
        { status: 500 }
      );
    }

    console.log('Admin API: Found', materials?.length || 0, 'materials');

    return NextResponse.json({
      success: true,
      data: materials || []
    });

  } catch (error: any) {
    console.error('Admin API: Unexpected error:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

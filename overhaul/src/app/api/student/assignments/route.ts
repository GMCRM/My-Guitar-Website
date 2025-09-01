import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create a service role client for student operations
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Missing student ID' },
        { status: 400 }
      );
    }

    console.log('Student API: Loading assignments for student:', studentId);

    // Get student assignments using service role (bypasses RLS)
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('student_assignments')
      .select('*')
      .eq('student_id', studentId)
      .order('day_order', { ascending: true });

    if (assignmentsError) {
      console.error('Student API: Assignments query error:', assignmentsError);
      return NextResponse.json(
        { error: `Database error: ${assignmentsError.message}` },
        { status: 500 }
      );
    }

    console.log('Student API: Found', assignments?.length || 0, 'assignments');

    return NextResponse.json({
      success: true,
      data: assignments || []
    });

  } catch (error: any) {
    console.error('Student API: Unexpected error:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    const body = await request.json();
    const { assignmentId, completed } = body;

    if (!assignmentId || !studentId) {
      return NextResponse.json(
        { error: 'Missing assignment ID or student ID' },
        { status: 400 }
      );
    }

    console.log('Student API: Updating assignment:', assignmentId, 'for student:', studentId, 'completed:', completed);

    // Verify the assignment belongs to the student
    const { data: assignment, error: checkError } = await supabaseAdmin
      .from('student_assignments')
      .select('*')
      .eq('id', assignmentId)
      .eq('student_id', studentId)
      .single();

    if (checkError || !assignment) {
      return NextResponse.json(
        { error: 'Assignment not found or access denied' },
        { status: 404 }
      );
    }

    // Update the assignment
    const { data: updatedAssignment, error: updateError } = await supabaseAdmin
      .from('student_assignments')
      .update({ completed })
      .eq('id', assignmentId)
      .eq('student_id', studentId)
      .select()
      .single();

    if (updateError) {
      console.error('Student API: Assignment update error:', updateError);
      return NextResponse.json(
        { error: `Database error: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log('Student API: Assignment updated successfully');

    return NextResponse.json({
      success: true,
      data: updatedAssignment
    });

  } catch (error: any) {
    console.error('Student API: Unexpected error:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

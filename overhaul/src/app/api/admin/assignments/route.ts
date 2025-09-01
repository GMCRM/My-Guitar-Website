import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    // Verify admin access
    if (userEmail !== process.env.NEXT_PUBLIC_BLOG_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { student_id, day, title, description } = body;

    if (!student_id || !day || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: student_id, day, title' },
        { status: 400 }
      );
    }

    console.log('Admin API: Creating assignment for student:', student_id);

    const dayOrder = {
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6,
      'sunday': 7
    };

    // Create assignment using service role (bypasses RLS)
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('student_assignments')
      .insert({
        student_id,
        day,
        day_order: dayOrder[day as keyof typeof dayOrder],
        title,
        description: description || '',
        completed: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (assignmentError) {
      console.error('Admin API: Assignment creation error:', assignmentError);
      return NextResponse.json(
        { error: `Database error: ${assignmentError.message}` },
        { status: 500 }
      );
    }

    console.log('Admin API: Assignment created successfully');

    return NextResponse.json({
      success: true,
      data: assignment
    });

  } catch (error: any) {
    console.error('Admin API: Unexpected error:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    const body = await request.json();
    const { assignmentId, completed, day, title, description } = body;

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Missing assignment ID' },
        { status: 400 }
      );
    }

    console.log('Admin API: Updating assignment:', assignmentId);

    // For admin users, allow updates
    const isAdmin = userEmail === process.env.NEXT_PUBLIC_BLOG_ADMIN_EMAIL;
    
    if (isAdmin) {
      // Prepare update object - only include fields that are provided
      const updateData: any = {};
      
      if (completed !== undefined) updateData.completed = completed;
      if (day !== undefined) {
        updateData.day = day;
        const dayOrder = {
          'monday': 1,
          'tuesday': 2,
          'wednesday': 3,
          'thursday': 4,
          'friday': 5,
          'saturday': 6,
          'sunday': 7
        };
        updateData.day_order = dayOrder[day as keyof typeof dayOrder];
      }
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;

      // Admin can update any assignment
      const { data: assignment, error: updateError } = await supabaseAdmin
        .from('student_assignments')
        .update(updateData)
        .eq('id', assignmentId)
        .select()
        .single();

      if (updateError) {
        console.error('Admin API: Assignment update error:', updateError);
        return NextResponse.json(
          { error: `Database error: ${updateError.message}` },
          { status: 500 }
        );
      }

      console.log('Admin API: Assignment updated successfully');

      return NextResponse.json({
        success: true,
        data: assignment
      });
    } else {
      // For non-admin users, we could add student-specific logic here
      // For now, return unauthorized for non-admin assignment updates
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required for assignment updates' },
        { status: 403 }
      );
    }

  } catch (error: any) {
    console.error('Admin API: Unexpected error:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const userEmail = searchParams.get('userEmail');

    // Verify admin access
    if (userEmail !== process.env.NEXT_PUBLIC_BLOG_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    if (!studentId) {
      return NextResponse.json(
        { error: 'Missing student ID' },
        { status: 400 }
      );
    }

    console.log('Admin API: Loading assignments for student:', studentId);

    // Get student assignments using service role (bypasses RLS)
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('student_assignments')
      .select('*')
      .eq('student_id', studentId)
      .order('day_order', { ascending: true });

    if (assignmentsError) {
      console.error('Admin API: Assignments query error:', assignmentsError);
      return NextResponse.json(
        { error: `Database error: ${assignmentsError.message}` },
        { status: 500 }
      );
    }

    console.log('Admin API: Found', assignments?.length || 0, 'assignments');

    return NextResponse.json({
      success: true,
      data: assignments || []
    });

  } catch (error: any) {
    console.error('Admin API: Unexpected error:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

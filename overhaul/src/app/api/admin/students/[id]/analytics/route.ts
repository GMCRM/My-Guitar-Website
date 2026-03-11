import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase with service role for admin operations
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    const body = await request.json();
    const { analytics_opt_in } = body;

    console.log('PATCH analytics opt-in for student:', studentId, 'to:', analytics_opt_in);

    // Validate input
    if (typeof analytics_opt_in !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid input: analytics_opt_in must be a boolean' },
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
          analytics_opt_in: analytics_opt_in,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'id'
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error updating analytics opt-in:', error);
      return NextResponse.json(
        { error: 'Failed to update analytics opt-in setting' },
        { status: 500 }
      );
    }

    console.log('Successfully updated analytics opt-in:', data);
    return NextResponse.json({
      success: true,
      student_id: studentId,
      analytics_opt_in: data.analytics_opt_in
    });

  } catch (error) {
    console.error('Unexpected error in analytics toggle API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { leaderboard_opt_in } = body;

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

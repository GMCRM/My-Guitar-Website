import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create a service role client to bypass RLS for authorized student access
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

    console.log('Student API: Loading materials for student:', studentId);

    // Get student materials using service role (bypasses RLS)
    const { data: materials, error: materialsError } = await supabaseAdmin
      .from('student_materials')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (materialsError) {
      console.error('Student API: Materials query error:', materialsError);
      return NextResponse.json(
        { error: `Database error: ${materialsError.message}` },
        { status: 500 }
      );
    }

    console.log('Student API: Found', materials?.length || 0, 'materials');

    return NextResponse.json({
      success: true,
      data: materials || []
    });

  } catch (error: any) {
    console.error('Student API: Unexpected error:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

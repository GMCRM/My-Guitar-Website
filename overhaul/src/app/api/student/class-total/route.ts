import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase admin client (needs to see all included students regardless of RLS)
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
        { error: 'Missing required parameter: studentId' },
        { status: 400 }
      );
    }

    // Check if requesting student has class total visibility enabled
    const { data: studentSettings, error: settingsError } = await supabaseAdmin
      .from('students')
      .select('class_total_visible')
      .eq('id', studentId)
      .single();

    if (settingsError) {
      if (settingsError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Class total access requires opt-in' },
          { status: 403 }
        );
      }
      console.error('Error checking student settings:', settingsError);
      return NextResponse.json(
        { error: 'Failed to verify student settings' },
        { status: 500 }
      );
    }

    if (!studentSettings || !studentSettings.class_total_visible) {
      return NextResponse.json(
        { error: 'Class total access requires opt-in' },
        { status: 403 }
      );
    }

    // Get all students whose practice counts toward the class total
    const { data: includedStudents, error: studentsError } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('class_total_included', true);

    if (studentsError) {
      console.error('Error fetching included students:', studentsError);
      return NextResponse.json(
        { error: 'Failed to fetch class total data' },
        { status: 500 }
      );
    }

    const includedIds = (includedStudents || []).map(s => s.id);

    let totalPractices = 0;
    if (includedIds.length > 0) {
      const { count, error: countError } = await supabaseAdmin
        .from('student_habits')
        .select('*', { count: 'exact', head: true })
        .in('student_id', includedIds);

      if (countError) {
        console.error('Error counting practice days:', countError);
        return NextResponse.json(
          { error: 'Failed to fetch class total data' },
          { status: 500 }
        );
      }

      totalPractices = count || 0;
    }

    // Get the current milestone/goal
    const { data: milestoneRow, error: milestoneError } = await supabaseAdmin
      .from('class_practice_milestone')
      .select('milestone')
      .eq('id', 1)
      .single();

    if (milestoneError) {
      console.error('Error fetching milestone:', milestoneError);
    }

    return NextResponse.json({
      total_practices: totalPractices,
      milestone: milestoneRow?.milestone ?? 500
    });

  } catch (error) {
    console.error('Unexpected error in class total API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

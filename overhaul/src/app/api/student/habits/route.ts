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
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Missing student ID' },
        { status: 400 }
      );
    }

    if (!year || !month) {
      return NextResponse.json(
        { error: 'Missing year or month' },
        { status: 400 }
      );
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    // Build date range for the requested month
    const startDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
    const endDate = `${yearNum}-${String(monthNum + 1 > 12 ? 1 : monthNum + 1).padStart(2, '0')}-01`;
    const endYear = monthNum + 1 > 12 ? yearNum + 1 : yearNum;
    const endDateFinal = `${endYear}-${String(monthNum + 1 > 12 ? 1 : monthNum + 1).padStart(2, '0')}-01`;

    console.log('Student API: Loading habits for student:', studentId, 'month:', `${year}-${month}`);

    const { data: habits, error: habitsError } = await supabaseAdmin
      .from('student_habits')
      .select('*')
      .eq('student_id', studentId)
      .gte('date', startDate)
      .lt('date', endDateFinal)
      .order('date', { ascending: true });

    if (habitsError) {
      console.error('Student API: Habits query error:', habitsError);
      return NextResponse.json(
        { error: `Database error: ${habitsError.message}` },
        { status: 500 }
      );
    }

    console.log('Student API: Found', habits?.length || 0, 'habit entries');

    return NextResponse.json({
      success: true,
      data: habits || []
    });

  } catch (error: any) {
    console.error('Student API: Unexpected error:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    const body = await request.json();
    const { date } = body;

    if (!studentId || !date) {
      return NextResponse.json(
        { error: 'Missing student ID or date' },
        { status: 400 }
      );
    }

    console.log('Student API: Toggling habit for student:', studentId, 'date:', date);

    // Check if habit entry already exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('student_habits')
      .select('id')
      .eq('student_id', studentId)
      .eq('date', date)
      .maybeSingle();

    if (checkError) {
      console.error('Student API: Habit check error:', checkError);
      return NextResponse.json(
        { error: `Database error: ${checkError.message}` },
        { status: 500 }
      );
    }

    if (existing) {
      // Delete existing entry (un-mark the day)
      const { error: deleteError } = await supabaseAdmin
        .from('student_habits')
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        console.error('Student API: Habit delete error:', deleteError);
        return NextResponse.json(
          { error: `Database error: ${deleteError.message}` },
          { status: 500 }
        );
      }

      console.log('Student API: Habit removed for date:', date);

      return NextResponse.json({
        success: true,
        completed: false
      });
    } else {
      // Insert new entry (mark the day)
      const { data: newHabit, error: insertError } = await supabaseAdmin
        .from('student_habits')
        .insert({
          student_id: studentId,
          date,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Student API: Habit insert error:', insertError);
        return NextResponse.json(
          { error: `Database error: ${insertError.message}` },
          { status: 500 }
        );
      }

      console.log('Student API: Habit added for date:', date);

      return NextResponse.json({
        success: true,
        completed: true,
        data: newHabit
      });
    }

  } catch (error: any) {
    console.error('Student API: Unexpected error:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

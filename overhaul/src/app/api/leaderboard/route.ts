import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client with anon key for student verification
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Initialize Supabase admin client for leaderboard queries (needs to see all opted-in students)
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
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const studentId = searchParams.get('studentId');

    console.log('Leaderboard API called:', { year, month, studentId });

    // Validate required parameters
    if (!year || !month || !studentId) {
      return NextResponse.json(
        { error: 'Missing required parameters: year, month, studentId' },
        { status: 400 }
      );
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    // Validate year and month ranges
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { error: 'Invalid year or month value' },
        { status: 400 }
      );
    }

    // Check if requesting student has leaderboard opt-in enabled (use admin client)
    const { data: studentSettings, error: settingsError } = await supabaseAdmin
      .from('students')
      .select('leaderboard_opt_in')
      .eq('id', studentId)
      .single();

    console.log('Student settings check:', { studentId, studentSettings, settingsError });

    if (settingsError) {
      console.error('Error checking student settings:', settingsError);
      // If student record doesn't exist, they're not opted in
      if (settingsError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Leaderboard access requires opt-in' },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to verify student settings' },
        { status: 500 }
      );
    }

    if (!studentSettings || !studentSettings.leaderboard_opt_in) {
      return NextResponse.json(
        { error: 'Leaderboard access requires opt-in' },
        { status: 403 }
      );
    }

    // Calculate date range for the requested month
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log('Fetching leaderboard data for:', { yearNum, monthNum, startDateStr, endDateStr });

    // Get all opted-in students (use admin client)
    const { data: optedInStudents, error: studentsError } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('leaderboard_opt_in', true);

    console.log('Opted-in students:', optedInStudents);

    if (studentsError) {
      console.error('Error fetching opted-in students:', studentsError);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard data' },
        { status: 500 }
      );
    }

    if (!optedInStudents || optedInStudents.length === 0) {
      console.log('No opted-in students found');
      return NextResponse.json([]);
    }

    const studentIds = optedInStudents.map(s => s.id);
    console.log('Student IDs to query:', studentIds);

    // Get practice days for each opted-in student (use admin client)
    const { data: habitData, error: habitsError } = await supabaseAdmin
      .from('student_habits')
      .select('student_id, date')
      .in('student_id', studentIds)
      .gte('date', startDateStr)
      .lte('date', endDateStr);

    if (habitsError) {
      console.error('Error fetching habit data:', habitsError);
      return NextResponse.json(
        { error: 'Failed to fetch practice data' },
        { status: 500 }
      );
    }

    console.log('Habit data fetched:', habitData?.length, 'records');

    // Get user metadata for names (use admin client)
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // Create a map of practice days per student
    const practiceDaysMap = new Map<string, Set<string>>();
    habitData?.forEach(habit => {
      if (!practiceDaysMap.has(habit.student_id)) {
        practiceDaysMap.set(habit.student_id, new Set());
      }
      practiceDaysMap.get(habit.student_id)?.add(habit.date);
    });

    // Build leaderboard array with user info
    const leaderboard = studentIds
      .map(studentId => {
        const user = usersData.users.find(u => u.id === studentId);
        const practiceDays = practiceDaysMap.get(studentId)?.size || 0;

        return {
          student_id: studentId,
          first_name: user?.user_metadata?.first_name || '',
          last_name: user?.user_metadata?.last_name || '',
          email: user?.email || '',
          practice_days: practiceDays
        };
      })
      .filter(entry => entry.practice_days > 0) // Only include students with at least 1 practice day
      .sort((a, b) => {
        // Sort by practice days descending, then alphabetically by name
        if (b.practice_days !== a.practice_days) {
          return b.practice_days - a.practice_days;
        }
        const nameA = `${a.first_name} ${a.last_name}`.trim() || a.email;
        const nameB = `${b.first_name} ${b.last_name}`.trim() || b.email;
        return nameA.localeCompare(nameB);
      });

    console.log('Leaderboard built with', leaderboard.length, 'entries');
    return NextResponse.json(leaderboard);

  } catch (error) {
    console.error('Unexpected error in leaderboard API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

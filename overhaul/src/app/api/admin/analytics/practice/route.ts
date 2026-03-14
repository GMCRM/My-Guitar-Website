import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getAccessibleStudentIds, resolveActorContext } from '../../_utils/teacherAuth';

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

interface PracticeAnalyticsRecord {
  student_id: string;
  student_name: string;
  month: number;
  year: number;
  practice_days: number;
}

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching analytics data...');

    const userEmail = request.nextUrl.searchParams.get('userEmail');
    const actor = await resolveActorContext(userEmail);
    if (!actor) {
      return NextResponse.json(
        { error: 'Unauthorized - Teacher access required' },
        { status: 403 }
      );
    }

    if (!actor.isSuperAdmin && !actor.permissions.can_view_analytics) {
      return NextResponse.json(
        { error: 'Unauthorized - Analytics permission required' },
        { status: 403 }
      );
    }

    const accessibleStudentIds = await getAccessibleStudentIds(actor);
    
    // Fetch all habit records
    const { data: habits, error: habitsError } = await supabaseAdmin
      .from('student_habits')
      .select('student_id, date')
      .order('date', { ascending: false });

    console.log('Habits query result:', { 
      count: habits?.length || 0, 
      error: habitsError,
      sample: habits?.slice(0, 3)
    });

    if (habitsError) {
      console.error('Error fetching habits:', habitsError);
      return NextResponse.json(
        { error: 'Failed to fetch practice data' },
        { status: 500 }
      );
    }

    if (!habits || habits.length === 0) {
      console.log('No habits found, returning empty array');
      return NextResponse.json([]);
    }

    // Get students who have opted into analytics
    const { data: studentsOptIn, error: studentsError } = await supabaseAdmin
      .from('students')
      .select('id, analytics_opt_in')
      .eq('analytics_opt_in', true);

    if (studentsError) {
      console.error('Error fetching students opt-in status:', studentsError);
      return NextResponse.json(
        { error: 'Failed to fetch student settings' },
        { status: 500 }
      );
    }

    // Create a set of opted-in student IDs for quick lookup
    const optedInStudentIds = new Set(studentsOptIn?.map(s => s.id) || []);
    console.log('Students opted into analytics:', optedInStudentIds.size);

    // Filter habits to only include opted-in students
    const filteredHabits = habits.filter(
      (habit) => optedInStudentIds.has(habit.student_id) && accessibleStudentIds.has(habit.student_id)
    );
    console.log('Filtered habits count:', filteredHabits.length);

    if (filteredHabits.length === 0) {
      console.log('No habits for opted-in students, returning empty array');
      return NextResponse.json([]);
    }

    // Get all students
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    console.log('Users query result:', { 
      count: usersData?.users?.length || 0, 
      error: usersError 
    });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // Create a map of users for quick lookup
    const usersMap = new Map(
      usersData.users.map(user => [
        user.id,
        {
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || ''
        }
      ])
    );

    console.log('Users map created:', {
      mapSize: usersMap.size,
      sampleUserIds: Array.from(usersMap.keys()).slice(0, 2)
    });

    // Aggregate practice days by student and month
    const aggregationMap = new Map<string, Set<string>>();

    filteredHabits.forEach(habit => {
      const date = new Date(habit.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // JavaScript months are 0-indexed
      const key = `${habit.student_id}|${year}|${month}`; // Use | instead of - to avoid UUID conflicts

      if (!aggregationMap.has(key)) {
        aggregationMap.set(key, new Set());
      }
      aggregationMap.get(key)?.add(habit.date);
    });

    console.log('Aggregation map created:', {
      mapSize: aggregationMap.size,
      sampleKeys: Array.from(aggregationMap.keys()).slice(0, 3)
    });

    // Build analytics array
    const analytics: PracticeAnalyticsRecord[] = [];
    
    let skippedCount = 0;

    aggregationMap.forEach((dates, key) => {
      const [studentId, yearStr, monthStr] = key.split('|'); // Split by | to match the key format
      const user = usersMap.get(studentId);

      if (!user) {
        console.log('User not found for studentId:', studentId);
        skippedCount++;
        return; // Skip if user not found
      }

      const studentName = `${user.first_name} ${user.last_name}`.trim() || `Student ${studentId.slice(0, 6)}`;

      analytics.push({
        student_id: studentId,
        student_name: studentName,
        month: parseInt(monthStr),
        year: parseInt(yearStr),
        practice_days: dates.size
      });
    });

    console.log('Analytics processing complete:', {
      totalRecords: analytics.length,
      skippedUsers: skippedCount
    });

    // Sort by year DESC, month DESC, then student name
    analytics.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      if (b.month !== a.month) return b.month - a.month;
      return a.student_name.localeCompare(b.student_name);
    });

    console.log('Analytics built:', {
      recordCount: analytics.length,
      sample: analytics.slice(0, 3)
    });

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Unexpected error in analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

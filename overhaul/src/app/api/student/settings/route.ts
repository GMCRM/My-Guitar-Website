import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client with anon key (RLS enforced)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    // Validate required parameter
    if (!studentId) {
      return NextResponse.json(
        { error: 'Missing required parameter: studentId' },
        { status: 400 }
      );
    }

    console.log('Fetching settings for student:', studentId);

    // Fetch student settings (RLS will ensure student can only view their own)
    const { data: studentSettings, error } = await supabase
      .from('students')
      .select('leaderboard_opt_in, analytics_opt_in')
      .eq('id', studentId)
      .single();

    if (error) {
      // If record doesn't exist, return default false
      if (error.code === 'PGRST116') {
        console.log('No settings record found for student, returning default false');
        return NextResponse.json({ 
          leaderboard_opt_in: false,
          analytics_opt_in: false
        });
      }
      console.error('Error fetching student settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch student settings' },
        { status: 500 }
      );
    }

    console.log('Student settings found:', studentSettings);
    return NextResponse.json({
      leaderboard_opt_in: studentSettings?.leaderboard_opt_in || false,
      analytics_opt_in: studentSettings?.analytics_opt_in || false
    });

  } catch (error) {
    console.error('Unexpected error in student settings API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

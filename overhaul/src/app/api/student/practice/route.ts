import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// GET — fetch the authenticated student's assigned practice content
export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get('studentId');

  if (!studentId) {
    return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
  }

  try {
    const [tracksRes, patternsRes, keysRes] = await Promise.all([
      supabaseAdmin
        .from('student_backing_tracks')
        .select('track_id, backing_tracks(*)')
        .eq('student_id', studentId),
      supabaseAdmin
        .from('student_strumming_patterns')
        .select('pattern_id, strumming_patterns(*)')
        .eq('student_id', studentId),
      supabaseAdmin
        .from('student_musical_keys')
        .select('key_id, musical_keys(*)')
        .eq('student_id', studentId),
    ]);

    if (tracksRes.error || patternsRes.error || keysRes.error) {
      console.error('Error fetching practice data:', tracksRes.error, patternsRes.error, keysRes.error);
      return NextResponse.json({ error: 'Failed to fetch practice data' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        tracks: (tracksRes.data || []).map((r: any) => r.backing_tracks).filter(Boolean),
        patterns: (patternsRes.data || []).map((r: any) => r.strumming_patterns).filter(Boolean),
        keys: (keysRes.data || []).map((r: any) => r.musical_keys).filter(Boolean),
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

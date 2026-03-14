import { NextRequest, NextResponse } from 'next/server';
import { canAccessStudent, resolveActorContext, supabaseAdmin } from '../../_utils/teacherAuth';

// GET — fetch a student's current practice assignments
export async function GET(request: NextRequest) {
  const userEmail = request.nextUrl.searchParams.get('userEmail');
  const studentId = request.nextUrl.searchParams.get('studentId');

  const actor = await resolveActorContext(userEmail);
  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  if (!actor.isSuperAdmin && !actor.permissions.can_assign_practice) {
    return NextResponse.json({ error: 'Unauthorized - Practice assignment permission required' }, { status: 403 });
  }
  if (!studentId) {
    return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
  }

  const hasAccess = await canAccessStudent(actor, studentId);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Unauthorized - You can only access assigned students' }, { status: 403 });
  }

  const [tracksRes, patternsRes, keysRes] = await Promise.all([
    supabaseAdmin
      .from('student_backing_tracks')
      .select('track_id')
      .eq('student_id', studentId),
    supabaseAdmin
      .from('student_strumming_patterns')
      .select('pattern_id')
      .eq('student_id', studentId),
    supabaseAdmin
      .from('student_musical_keys')
      .select('key_id')
      .eq('student_id', studentId),
  ]);

  if (tracksRes.error || patternsRes.error || keysRes.error) {
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: {
      trackIds: (tracksRes.data || []).map((r) => r.track_id),
      patternIds: (patternsRes.data || []).map((r) => r.pattern_id),
      keyIds: (keysRes.data || []).map((r) => r.key_id),
    }
  });
}

// POST — replace all assignments for a student (delete + insert)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, trackIds, patternIds, keyIds, userEmail } = body;

    const actor = await resolveActorContext(userEmail);
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!actor.isSuperAdmin && !actor.permissions.can_assign_practice) {
      return NextResponse.json({ error: 'Unauthorized - Practice assignment permission required' }, { status: 403 });
    }
    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    const hasAccess = await canAccessStudent(actor, studentId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized - You can only manage assigned students' }, { status: 403 });
    }

    // Delete existing assignments
    await Promise.all([
      supabaseAdmin.from('student_backing_tracks').delete().eq('student_id', studentId),
      supabaseAdmin.from('student_strumming_patterns').delete().eq('student_id', studentId),
      supabaseAdmin.from('student_musical_keys').delete().eq('student_id', studentId),
    ]);

    // Insert new assignments
    const insertOps = [];

    if (trackIds?.length > 0) {
      insertOps.push(
        supabaseAdmin.from('student_backing_tracks').insert(
          trackIds.map((track_id: string) => ({ student_id: studentId, track_id }))
        )
      );
    }

    if (patternIds?.length > 0) {
      insertOps.push(
        supabaseAdmin.from('student_strumming_patterns').insert(
          patternIds.map((pattern_id: string) => ({ student_id: studentId, pattern_id }))
        )
      );
    }

    if (keyIds?.length > 0) {
      insertOps.push(
        supabaseAdmin.from('student_musical_keys').insert(
          keyIds.map((key_id: string) => ({ student_id: studentId, key_id }))
        )
      );
    }

    if (insertOps.length > 0) {
      const results = await Promise.all(insertOps);
      const insertError = results.find(r => r.error);
      if (insertError?.error) {
        return NextResponse.json({ error: insertError.error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

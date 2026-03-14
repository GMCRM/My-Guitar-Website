import { NextRequest, NextResponse } from 'next/server';
import { resolveActorContext, supabaseAdmin } from '../../_utils/teacherAuth';

// GET — list all backing tracks
export async function GET(request: NextRequest) {
  const userEmail = request.nextUrl.searchParams.get('userEmail');
  const actor = await resolveActorContext(userEmail);
  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  if (!actor.isSuperAdmin && !actor.permissions.can_assign_practice) {
    return NextResponse.json({ error: 'Unauthorized - Practice assignment permission required' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('backing_tracks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
}

// POST — create a new backing track
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, audio_url, userEmail } = body;

    const actor = await resolveActorContext(userEmail);
    if (!actor || !actor.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!name || !audio_url) {
      return NextResponse.json({ error: 'Name and audio_url are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('backing_tracks')
      .insert({ name, audio_url })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

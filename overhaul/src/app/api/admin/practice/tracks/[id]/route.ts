import { NextRequest, NextResponse } from 'next/server';
import { resolveActorContext, supabaseAdmin } from '../../../_utils/teacherAuth';

// PUT — update a backing track
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, audio_url, userEmail } = body;

    const actor = await resolveActorContext(userEmail);
    if (!actor || !actor.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updateData: Record<string, string> = {};
    if (name) updateData.name = name;
    if (audio_url) updateData.audio_url = audio_url;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('backing_tracks')
      .update(updateData)
      .eq('id', id)
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

// DELETE — delete a backing track (and its storage file)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userEmail = request.nextUrl.searchParams.get('userEmail');

  const actor = await resolveActorContext(userEmail);
  if (!actor || !actor.isSuperAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Get the track to find its audio file path
  const { data: track } = await supabaseAdmin
    .from('backing_tracks')
    .select('audio_url')
    .eq('id', id)
    .single();

  // Delete from storage if the URL is a Supabase storage URL
  if (track?.audio_url && track.audio_url.includes('/storage/v1/object/public/backing-tracks/')) {
    const filePath = track.audio_url.split('/backing-tracks/')[1];
    if (filePath) {
      await supabaseAdmin.storage.from('backing-tracks').remove([filePath]);
    }
  }

  // Delete join table references first
  await supabaseAdmin
    .from('student_backing_tracks')
    .delete()
    .eq('track_id', id);

  const { error } = await supabaseAdmin
    .from('backing_tracks')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

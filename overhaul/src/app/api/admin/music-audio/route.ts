import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, resolveActorContext } from '../_utils/teacherAuth';

const AUDIO_BUCKET = 'music-audio';
const MAX_AUDIO_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_AUDIO_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/webm',
  'audio/aac',
  'audio/m4a',
  'audio/mp4'
]);

async function requireAudioManager(userEmail?: string | null) {
  const actor = await resolveActorContext(userEmail);

  if (!actor) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 403 }), actor: null };
  }

  if (!actor.isSuperAdmin && !actor.permissions.can_upload_videos) {
    return {
      error: NextResponse.json({ error: 'Unauthorized - Audio management permission required' }, { status: 403 }),
      actor: null
    };
  }

  return { error: null, actor };
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.-]/g, '_');
}

function getTitleFromFileName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
}

function isSupportedAudio(file: File) {
  if (ALLOWED_AUDIO_MIME_TYPES.has(file.type)) {
    return true;
  }

  return /\.(mp3|wav|ogg|m4a|aac|webm)$/i.test(file.name);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    const auth = await requireAudioManager(userEmail);
    if (auth.error) {
      return auth.error;
    }

    const { data, error } = await supabaseAdmin
      .from('music_audio_tracks')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading music audio tracks:', error);
      return NextResponse.json({ error: 'Failed to load audio tracks' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error in admin music audio GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userEmail = String(formData.get('userEmail') || '').trim();
    const providedTitle = String(formData.get('title') || '').trim();

    const auth = await requireAudioManager(userEmail);
    if (auth.error) {
      return auth.error;
    }

    if (!file) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    if (file.size > MAX_AUDIO_SIZE_BYTES) {
      return NextResponse.json({ error: 'Audio file must be 50MB or less' }, { status: 400 });
    }

    if (!isSupportedAudio(file)) {
      return NextResponse.json({ error: 'Unsupported audio format' }, { status: 400 });
    }

    const safeName = sanitizeFileName(file.name || `track-${Date.now()}.mp3`);
    const filePath = `${Date.now()}-${safeName}`;
    const title = providedTitle || getTitleFromFileName(safeName) || `Track ${Date.now()}`;

    const { data: existingTracks, error: existingError } = await supabaseAdmin
      .from('music_audio_tracks')
      .select('id')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (existingError) {
      console.error('Error loading existing audio tracks before insert:', existingError);
      return NextResponse.json({ error: 'Failed to prepare track order' }, { status: 500 });
    }

    const shiftUpdates = (existingTracks || []).map((track, index) =>
      supabaseAdmin
        .from('music_audio_tracks')
        .update({ display_order: index + 1 })
        .eq('id', track.id)
    );

    const shiftResults = await Promise.all(shiftUpdates);
    const shiftFailed = shiftResults.find((result) => result.error);
    if (shiftFailed?.error) {
      console.error('Error shifting existing track orders:', shiftFailed.error);
      return NextResponse.json({ error: 'Failed to update existing track order' }, { status: 500 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from(AUDIO_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type || 'audio/mpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading audio file:', uploadError);
      return NextResponse.json({ error: 'Failed to upload audio file' }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from(AUDIO_BUCKET).getPublicUrl(filePath);

    const { data, error } = await supabaseAdmin
      .from('music_audio_tracks')
      .insert({
        title,
        file_path: filePath,
        public_url: publicUrlData.publicUrl,
        file_size: file.size,
        mime_type: file.type || 'audio/mpeg',
        display_order: 0
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating music audio track record:', error);
      await supabaseAdmin.storage.from(AUDIO_BUCKET).remove([filePath]);
      return NextResponse.json({ error: 'Failed to save audio track' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in admin music audio POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    const auth = await requireAudioManager(userEmail);
    if (auth.error) {
      return auth.error;
    }

    const body = await request.json();
    const orderedAudioIds = Array.isArray(body?.orderedAudioIds) ? body.orderedAudioIds : null;

    if (!orderedAudioIds || orderedAudioIds.length === 0) {
      return NextResponse.json({ error: 'orderedAudioIds is required' }, { status: 400 });
    }

    const normalizedIds = orderedAudioIds
      .map((id: unknown) => Number(id))
      .filter((id: number) => Number.isFinite(id));

    if (normalizedIds.length !== orderedAudioIds.length) {
      return NextResponse.json({ error: 'orderedAudioIds contains invalid ids' }, { status: 400 });
    }

    const updates = normalizedIds.map((id: number, index: number) =>
      supabaseAdmin
        .from('music_audio_tracks')
        .update({ display_order: index })
        .eq('id', id)
    );

    const results = await Promise.all(updates);
    const failed = results.find((result) => result.error);
    if (failed?.error) {
      console.error('Error updating music audio order:', failed.error);
      return NextResponse.json({ error: 'Failed to reorder audio tracks' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in admin music audio PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    const trackId = searchParams.get('trackId');

    const auth = await requireAudioManager(userEmail);
    if (auth.error) {
      return auth.error;
    }

    if (!trackId) {
      return NextResponse.json({ error: 'Track ID is required' }, { status: 400 });
    }

    const numericTrackId = Number(trackId);
    if (!Number.isFinite(numericTrackId)) {
      return NextResponse.json({ error: 'Invalid track ID' }, { status: 400 });
    }

    const { data: existingTrack, error: fetchError } = await supabaseAdmin
      .from('music_audio_tracks')
      .select('id, file_path')
      .eq('id', numericTrackId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error finding music audio track before delete:', fetchError);
      return NextResponse.json({ error: 'Failed to delete audio track' }, { status: 500 });
    }

    if (!existingTrack) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('music_audio_tracks')
      .delete()
      .eq('id', numericTrackId);

    if (deleteError) {
      console.error('Error deleting music audio track:', deleteError);
      return NextResponse.json({ error: 'Failed to delete audio track' }, { status: 500 });
    }

    if (existingTrack.file_path) {
      const { error: storageDeleteError } = await supabaseAdmin.storage.from(AUDIO_BUCKET).remove([existingTrack.file_path]);
      if (storageDeleteError) {
        console.error('Warning: audio deleted from table but failed in storage cleanup:', storageDeleteError);
      }
    }

    const { data: remainingTracks, error: remainingError } = await supabaseAdmin
      .from('music_audio_tracks')
      .select('id')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (remainingError) {
      console.error('Error loading remaining audio tracks:', remainingError);
      return NextResponse.json({ error: 'Track deleted, but reorder failed' }, { status: 500 });
    }

    const reorderUpdates = (remainingTracks || []).map((track, index) =>
      supabaseAdmin
        .from('music_audio_tracks')
        .update({ display_order: index })
        .eq('id', track.id)
    );

    const reorderResults = await Promise.all(reorderUpdates);
    const reorderFailed = reorderResults.find((result) => result.error);
    if (reorderFailed?.error) {
      console.error('Error normalizing order after audio delete:', reorderFailed.error);
      return NextResponse.json({ error: 'Track deleted, but reorder failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in admin music audio DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

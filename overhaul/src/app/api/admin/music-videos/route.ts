import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, resolveActorContext } from '../_utils/teacherAuth';

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

async function fetchVideoData(videoId: string) {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title,
        author_name: data.author_name,
        thumbnail_url: data.thumbnail_url,
      };
    }
  } catch (error) {
    console.error('Error fetching video data:', error);
  }

  return {
    title: `Video ${videoId}`,
    author_name: 'Grant Matai Cross',
    thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
  };
}

async function requireVideoManager(userEmail?: string | null) {
  const actor = await resolveActorContext(userEmail);

  if (!actor) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 403 }), actor: null };
  }

  if (!actor.isSuperAdmin && !actor.permissions.can_upload_videos) {
    return {
      error: NextResponse.json({ error: 'Unauthorized - Video management permission required' }, { status: 403 }),
      actor: null
    };
  }

  return { error: null, actor };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    const auth = await requireVideoManager(userEmail);
    if (auth.error) {
      return auth.error;
    }

    const { data, error } = await supabaseAdmin
      .from('music_videos')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading music videos:', error);
      return NextResponse.json({ error: 'Failed to load videos' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error in admin music videos GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    const auth = await requireVideoManager(userEmail);
    if (auth.error) {
      return auth.error;
    }

    const body = await request.json();
    const youtubeUrl = body?.youtubeUrl?.trim();

    if (!youtubeUrl) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 });
    }

    const youtubeId = extractYouTubeId(youtubeUrl);
    if (!youtubeId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    const { data: existingVideo } = await supabaseAdmin
      .from('music_videos')
      .select('id')
      .eq('youtube_id', youtubeId)
      .maybeSingle();

    if (existingVideo) {
      return NextResponse.json({ error: 'This YouTube video is already in your music list' }, { status: 409 });
    }

    const { data: existingVideos, error: existingError } = await supabaseAdmin
      .from('music_videos')
      .select('id')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (existingError) {
      console.error('Error loading existing videos before insert:', existingError);
      return NextResponse.json({ error: 'Failed to prepare video order' }, { status: 500 });
    }

    const shiftUpdates = (existingVideos || []).map((video, index) =>
      supabaseAdmin
        .from('music_videos')
        .update({ display_order: index + 1 })
        .eq('id', video.id)
    );

    const shiftResults = await Promise.all(shiftUpdates);
    const shiftFailed = shiftResults.find((result) => result.error);
    if (shiftFailed?.error) {
      console.error('Error shifting existing video orders:', shiftFailed.error);
      return NextResponse.json({ error: 'Failed to update existing video order' }, { status: 500 });
    }

    const videoData = await fetchVideoData(youtubeId);

    const { data, error } = await supabaseAdmin
      .from('music_videos')
      .insert({
        youtube_id: youtubeId,
        title: videoData.title,
        author_name: videoData.author_name,
        thumbnail_url: videoData.thumbnail_url,
        display_order: 0
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error adding music video:', error);
      return NextResponse.json({ error: 'Failed to add video' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in admin music videos POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    const auth = await requireVideoManager(userEmail);
    if (auth.error) {
      return auth.error;
    }

    const body = await request.json();
    const orderedVideoIds = Array.isArray(body?.orderedVideoIds) ? body.orderedVideoIds : null;

    if (!orderedVideoIds || orderedVideoIds.length === 0) {
      return NextResponse.json({ error: 'orderedVideoIds is required' }, { status: 400 });
    }

    const normalizedIds = orderedVideoIds
      .map((id: unknown) => Number(id))
      .filter((id: number) => Number.isFinite(id));

    if (normalizedIds.length !== orderedVideoIds.length) {
      return NextResponse.json({ error: 'orderedVideoIds contains invalid ids' }, { status: 400 });
    }

    const updates = normalizedIds.map((id: number, index: number) =>
      supabaseAdmin
        .from('music_videos')
        .update({ display_order: index })
        .eq('id', id)
    );

    const results = await Promise.all(updates);
    const failed = results.find((result) => result.error);
    if (failed?.error) {
      console.error('Error updating music video order:', failed.error);
      return NextResponse.json({ error: 'Failed to reorder videos' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in admin music videos PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    const videoId = searchParams.get('videoId');

    const auth = await requireVideoManager(userEmail);
    if (auth.error) {
      return auth.error;
    }

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    const numericVideoId = Number(videoId);
    if (!Number.isFinite(numericVideoId)) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('music_videos')
      .delete()
      .eq('id', numericVideoId);

    if (deleteError) {
      console.error('Error deleting music video:', deleteError);
      return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
    }

    const { data: remainingVideos, error: remainingError } = await supabaseAdmin
      .from('music_videos')
      .select('id')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (remainingError) {
      console.error('Error loading remaining videos:', remainingError);
      return NextResponse.json({ error: 'Video deleted, but reorder failed' }, { status: 500 });
    }

    const reorderUpdates = (remainingVideos || []).map((video, index) =>
      supabaseAdmin
        .from('music_videos')
        .update({ display_order: index })
        .eq('id', video.id)
    );

    const reorderResults = await Promise.all(reorderUpdates);
    const reorderFailed = reorderResults.find((result) => result.error);
    if (reorderFailed?.error) {
      console.error('Error normalizing order after delete:', reorderFailed.error);
      return NextResponse.json({ error: 'Video deleted, but reorder failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in admin music videos DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
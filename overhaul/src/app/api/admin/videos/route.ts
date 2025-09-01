import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key for admin operations
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Helper function to extract YouTube video ID from URL
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

// Helper function to fetch video data from YouTube oEmbed API
async function fetchVideoData(videoId: string) {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title,
        thumbnail_url: data.thumbnail_url,
      };
    }
  } catch (error) {
    console.error('Error fetching video data:', error);
  }
  return {
    title: `Video ${videoId}`,
    thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const userEmail = searchParams.get('userEmail');

    console.log('Admin videos API - GET request:', { studentId, userEmail });

    if (!userEmail || userEmail !== 'grantmatai@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Fetch videos for the student
    const { data: videos, error } = await supabase
      .from('student_videos')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching student videos:', error);
      return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
    }

    console.log('Fetched videos:', videos?.length || 0);
    return NextResponse.json({ success: true, data: videos || [] });

  } catch (error) {
    console.error('Error in admin videos API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    if (!userEmail || userEmail !== 'grantmatai@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { studentId, youtubeUrl, description } = body;

    console.log('Admin videos API - POST request:', { studentId, youtubeUrl, description });

    if (!studentId || !youtubeUrl) {
      return NextResponse.json({ error: 'Student ID and YouTube URL are required' }, { status: 400 });
    }

    // Extract YouTube video ID
    const youtubeId = extractYouTubeId(youtubeUrl);
    if (!youtubeId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Fetch video data from YouTube
    const videoData = await fetchVideoData(youtubeId);

    // Insert video into database
    const { data: video, error } = await supabase
      .from('student_videos')
      .insert({
        student_id: studentId,
        youtube_id: youtubeId,
        title: videoData.title,
        description: description || null,
        thumbnail_url: videoData.thumbnail_url,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding student video:', error);
      return NextResponse.json({ error: 'Failed to add video' }, { status: 500 });
    }

    console.log('Added video:', video);
    return NextResponse.json({ success: true, data: video });

  } catch (error) {
    console.error('Error in admin videos API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    const videoId = searchParams.get('videoId');

    if (!userEmail || userEmail !== 'grantmatai@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    console.log('Admin videos API - DELETE request:', { videoId });

    // Delete video from database
    const { error } = await supabase
      .from('student_videos')
      .delete()
      .eq('id', videoId);

    if (error) {
      console.error('Error deleting student video:', error);
      return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
    }

    console.log('Deleted video:', videoId);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in admin videos API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

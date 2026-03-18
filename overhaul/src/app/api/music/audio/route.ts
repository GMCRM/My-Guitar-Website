import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('music_audio_tracks')
      .select('id, title, public_url, display_order, created_at')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading public music audio tracks:', error);
      return NextResponse.json({ error: 'Failed to load music audio tracks' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error in public music audio API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

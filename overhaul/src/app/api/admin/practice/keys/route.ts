import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function isAdmin(email: string | null) {
  return email === process.env.NEXT_PUBLIC_BLOG_ADMIN_EMAIL;
}

// GET — list all musical keys
export async function GET(request: NextRequest) {
  const userEmail = request.nextUrl.searchParams.get('userEmail');
  if (!isAdmin(userEmail)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('musical_keys')
    .select('*')
    .order('key_name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
}

// POST — create a new musical key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key_name, chord_i, chord_iv, chord_v, userEmail } = body;

    if (!isAdmin(userEmail)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!key_name || !chord_i || !chord_iv || !chord_v) {
      return NextResponse.json({ error: 'key_name, chord_i, chord_iv, and chord_v are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('musical_keys')
      .insert({ key_name, chord_i, chord_iv, chord_v })
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

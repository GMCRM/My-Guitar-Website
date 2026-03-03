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

// GET — list all strumming patterns
export async function GET(request: NextRequest) {
  const userEmail = request.nextUrl.searchParams.get('userEmail');
  if (!isAdmin(userEmail)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('strumming_patterns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
}

// POST — create a new strumming pattern
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, pattern_string, userEmail } = body;

    if (!isAdmin(userEmail)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!pattern_string) {
      return NextResponse.json({ error: 'pattern_string is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('strumming_patterns')
      .insert({ name: name || null, pattern_string })
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

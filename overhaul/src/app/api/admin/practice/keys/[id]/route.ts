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

// PUT — update a musical key
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { key_name, chord_i, chord_iv, chord_v, userEmail } = body;

    if (!isAdmin(userEmail)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updateData: Record<string, string> = { updated_at: new Date().toISOString() };
    if (key_name) updateData.key_name = key_name;
    if (chord_i) updateData.chord_i = chord_i;
    if (chord_iv) updateData.chord_iv = chord_iv;
    if (chord_v) updateData.chord_v = chord_v;

    const { data, error } = await supabaseAdmin
      .from('musical_keys')
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

// DELETE — delete a musical key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userEmail = request.nextUrl.searchParams.get('userEmail');

  if (!isAdmin(userEmail)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  await supabaseAdmin
    .from('student_musical_keys')
    .delete()
    .eq('key_id', id);

  const { error } = await supabaseAdmin
    .from('musical_keys')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

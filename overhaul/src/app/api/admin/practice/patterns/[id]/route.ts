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

// PUT — update a strumming pattern
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, pattern_string, userEmail } = body;

    if (!isAdmin(userEmail)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updateData: Record<string, string | null> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name || null;
    if (pattern_string) updateData.pattern_string = pattern_string;

    const { data, error } = await supabaseAdmin
      .from('strumming_patterns')
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

// DELETE — delete a strumming pattern
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
    .from('student_strumming_patterns')
    .delete()
    .eq('pattern_id', id);

  const { error } = await supabaseAdmin
    .from('strumming_patterns')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

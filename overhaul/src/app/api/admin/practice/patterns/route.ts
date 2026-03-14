import { NextRequest, NextResponse } from 'next/server';
import { resolveActorContext, supabaseAdmin } from '../../_utils/teacherAuth';

// GET — list all strumming patterns
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

    const actor = await resolveActorContext(userEmail);
    if (!actor || !actor.isSuperAdmin) {
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

import { NextRequest, NextResponse } from 'next/server';
import { resolveActorContext, supabaseAdmin } from '../_utils/teacherAuth';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('class_practice_milestone')
      .select('milestone')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('Error fetching milestone:', error);
      return NextResponse.json({ milestone: 500 });
    }

    return NextResponse.json({ milestone: data?.milestone ?? 500 });
  } catch (error) {
    console.error('Unexpected error fetching milestone:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { milestone, userEmail } = body;

    const actor = await resolveActorContext(userEmail);
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized - Teacher access required' }, { status: 403 });
    }

    if (!actor.isSuperAdmin && !actor.permissions.can_manage_students) {
      return NextResponse.json(
        { error: 'Unauthorized - You do not have permission to update the class goal' },
        { status: 403 }
      );
    }

    if (typeof milestone !== 'number' || !Number.isInteger(milestone) || milestone <= 0) {
      return NextResponse.json(
        { error: 'Invalid input: milestone must be a positive integer' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('class_practice_milestone')
      .upsert(
        {
          id: 1,
          milestone,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'id'
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error updating milestone:', error);
      return NextResponse.json(
        { error: 'Failed to update class goal' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, milestone: data.milestone });

  } catch (error) {
    console.error('Unexpected error updating milestone:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

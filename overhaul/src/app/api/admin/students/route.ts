import { NextRequest, NextResponse } from 'next/server';
import { getAccessibleStudentIds, resolveActorContext, supabaseAdmin } from '../_utils/teacherAuth';

// GET - List all students
export async function GET(request: NextRequest) {
  try {
    const userEmail = request.nextUrl.searchParams.get('userEmail');
    const actor = await resolveActorContext(userEmail);

    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized - Teacher access required' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (actor.isSuperAdmin) {
      return NextResponse.json({ data: data.users });
    }

    const accessibleStudentIds = await getAccessibleStudentIds(actor);
    const filteredUsers = data.users.filter((user) => accessibleStudentIds.has(user.id));

    return NextResponse.json({ data: filteredUsers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new student
export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, userEmail } = await request.json();

    const actor = await resolveActorContext(userEmail);
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized - Teacher access required' }, { status: 403 });
    }

    if (!actor.isSuperAdmin && !actor.permissions.can_manage_students) {
      return NextResponse.json({ error: 'Unauthorized - Student management permission required' }, { status: 403 });
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName || '',
        last_name: lastName || ''
      }
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data.user?.id) {
      const { error: studentRowError } = await supabaseAdmin
        .from('students')
        .upsert({
          id: data.user.id,
          assigned_teacher_id: actor.isSuperAdmin ? null : actor.teacherId,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (studentRowError) {
        return NextResponse.json({ error: studentRowError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ user: data.user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

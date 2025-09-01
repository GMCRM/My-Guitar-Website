import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create admin client with service role key (server-side only)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// DELETE - Delete an assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    // Verify admin access
    if (userEmail !== 'grantmatai@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const assignmentId = params.id;

    // Delete from database
    const { error: dbError } = await supabaseAdmin
      .from('student_assignments')
      .delete()
      .eq('id', assignmentId);

    if (dbError) {
      console.error('Error deleting assignment from database:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    console.log('Admin API: Assignment deleted successfully:', assignmentId);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Admin API: Error deleting assignment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

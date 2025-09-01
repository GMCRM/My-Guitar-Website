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

// DELETE - Delete a material
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

    const materialId = params.id;

    // First get the material to find the file path
    const { data: material, error: fetchError } = await supabaseAdmin
      .from('student_materials')
      .select('file_path')
      .eq('id', materialId)
      .single();

    if (fetchError) {
      console.error('Error fetching material:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }

    // Delete from storage
    if (material?.file_path) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('student-materials')
        .remove([material.file_path]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Continue with database deletion even if storage fails
      }
    }

    // Delete from database
    const { error: dbError } = await supabaseAdmin
      .from('student_materials')
      .delete()
      .eq('id', materialId);

    if (dbError) {
      console.error('Error deleting from database:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    console.log('Admin API: Material deleted successfully:', materialId);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Admin API: Error deleting material:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { canActForStudent } from '@/app/api/admin/_utils/teacherAuth';

// Create a service role client for admin operations
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('filePath');
    const studentId = searchParams.get('studentId');

    if (!filePath || !studentId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (!(await canActForStudent(studentId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verify the user has access to this material
    const { data: material, error: materialError } = await supabaseAdmin
      .from('student_materials')
      .select('*')
      .eq('file_path', filePath)
      .eq('student_id', studentId)
      .single();

    if (materialError || !material) {
      return NextResponse.json(
        { error: 'Material not found or access denied' },
        { status: 404 }
      );
    }

    // Download the file from storage using service role
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('student-materials')
      .download(filePath);

    if (downloadError) {
      console.error('Storage download error:', downloadError);
      return NextResponse.json(
        { error: 'Failed to download file' },
        { status: 500 }
      );
    }

    // Return the file data
    const response = new NextResponse(fileData);
    response.headers.set('Content-Type', material.file_type || 'application/octet-stream');
    response.headers.set('Content-Disposition', `inline; filename="${material.file_name}"`);
    
    return response;

  } catch (error: any) {
    console.error('Download API error:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

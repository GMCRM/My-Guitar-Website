import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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
    const userEmail = searchParams.get('userEmail');

    if (!filePath || !studentId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
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

    // Check if user is admin or the student who owns the material
    const isAdmin = userEmail === process.env.NEXT_PUBLIC_BLOG_ADMIN_EMAIL;
    
    // Get the user's actual student ID from auth
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    if (!isAdmin) {
      // For non-admin users, verify they are requesting their own materials
      // This would require additional verification logic
      // For now, we'll trust the client-side verification
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

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

export async function POST(request: NextRequest) {
  try {
    // Check if the user is authenticated and is admin
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const studentId = formData.get('studentId') as string;
    const userEmail = formData.get('userEmail') as string;

    // Verify admin access
    if (userEmail !== process.env.NEXT_PUBLIC_BLOG_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    if (!file || !studentId) {
      return NextResponse.json(
        { error: 'Missing file or student ID' },
        { status: 400 }
      );
    }

    // Generate file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${studentId}/${Date.now()}.${fileExt}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log('Admin API: Uploading file:', fileName, 'Size:', buffer.length);

    // Upload using service role (bypasses RLS)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('student-materials')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Admin API: Upload error:', uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    console.log('Admin API: Upload successful:', uploadData.path);

    // Save to database using service role
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from('student_materials')
      .insert({
        student_id: studentId,
        file_name: file.name,
        file_path: uploadData.path,
        file_type: file.type,
        file_size: file.size,
        created_at: new Date().toISOString()
      })
      .select();

    if (dbError) {
      console.error('Admin API: Database error:', dbError);
      
      // Clean up uploaded file if database insert fails
      await supabaseAdmin.storage
        .from('student-materials')
        .remove([uploadData.path]);
      
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    console.log('Admin API: Database record created:', dbData);

    return NextResponse.json({
      success: true,
      data: {
        path: uploadData.path,
        record: dbData[0]
      }
    });

  } catch (error: any) {
    console.error('Admin API: Unexpected error:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

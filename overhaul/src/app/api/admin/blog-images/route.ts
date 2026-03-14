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
    // Check if the user is authenticated and has teacher access
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userEmail = formData.get('userEmail') as string;

    // Verify teacher access for blog management (super admin or teacher with blog permission)
    if (userEmail !== 'grantmatai@gmail.com') {
      // Check if user is a teacher with blog management permission
      const { data: teacher, error: teacherError } = await supabaseAdmin
        .from('teachers')
        .select('permissions')
        .eq('email', userEmail)
        .eq('is_active', true)
        .single();

      if (teacherError || !teacher) {
        return NextResponse.json(
          { error: 'Unauthorized - Teacher access required' },
          { status: 403 }
        );
      }

      // Check if teacher has blog management permission
      if (!teacher.permissions?.can_manage_blog) {
        return NextResponse.json(
          { error: 'Unauthorized - Blog management permission required' },
          { status: 403 }
        );
      }
    }

    if (!file) {
      return NextResponse.json(
        { error: 'Missing file' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please use JPG, PNG, GIF, or WebP images only.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Please use images under 10MB.' },
        { status: 400 }
      );
    }

    // Generate file path
    const fileName = `blog-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log('Admin API: Uploading blog image:', fileName, 'Size:', buffer.length);

    // Upload using service role (bypasses RLS)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('blog-images')
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

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('blog-images')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      data: {
        path: uploadData.path,
        publicUrl: publicUrl
      }
    });

  } catch (error) {
    console.error('Admin API: Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
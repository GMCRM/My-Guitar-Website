import { NextRequest, NextResponse } from 'next/server';
import { resolveActorContext, supabaseAdmin } from '../../_utils/teacherAuth';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userEmail = formData.get('userEmail') as string;

    const actor = await resolveActorContext(userEmail);
    if (!actor || !actor.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate audio file type
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/x-m4a'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|aac|m4a)$/i)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: mp3, wav, ogg, aac, m4a' },
        { status: 400 }
      );
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('backing-tracks')
      .upload(fileName, buffer, {
        contentType: file.type || `audio/${fileExt}`,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('backing-tracks')
      .getPublicUrl(uploadData.path);

    return NextResponse.json({
      success: true,
      data: {
        path: uploadData.path,
        publicUrl: urlData.publicUrl
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

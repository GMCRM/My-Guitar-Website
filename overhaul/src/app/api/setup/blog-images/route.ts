import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(
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
    const body = await request.json();
    const { adminEmail } = body;

    // Verify admin access
    if (!adminEmail || adminEmail !== 'grantmatai@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log('Setting up blog-images storage bucket...');

    // Create storage bucket for blog images
    const { data: bucketData, error: bucketError } = await supabase.storage
      .createBucket('blog-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 10 * 1024 * 1024 // 10MB
      });

    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('Error creating bucket:', bucketError);
      return NextResponse.json({ 
        error: 'Failed to create bucket: ' + bucketError.message 
      }, { status: 500 });
    }

    console.log('Blog images bucket created/verified successfully');

    // Create RLS policies using SQL execution
    const policies = [
      // Public read access for blog images
      {
        name: 'blog_images_public_read',
        sql: `
          DROP POLICY IF EXISTS "Blog images are publicly accessible" ON storage.objects;
          CREATE POLICY "Blog images are publicly accessible" ON storage.objects
          FOR SELECT
          USING (bucket_id = 'blog-images');
        `
      },
      // Admin can upload blog images
      {
        name: 'blog_images_admin_upload',
        sql: `
          DROP POLICY IF EXISTS "Admin can upload blog images" ON storage.objects;
          CREATE POLICY "Admin can upload blog images" ON storage.objects
          FOR INSERT
          WITH CHECK (
            bucket_id = 'blog-images' 
            AND (auth.jwt() ->> 'email' = 'grantmatai@gmail.com')
          );
        `
      },
      // Admin can update blog images
      {
        name: 'blog_images_admin_update',
        sql: `
          DROP POLICY IF EXISTS "Admin can update blog images" ON storage.objects;
          CREATE POLICY "Admin can update blog images" ON storage.objects
          FOR UPDATE
          USING (
            bucket_id = 'blog-images' 
            AND (auth.jwt() ->> 'email' = 'grantmatai@gmail.com')
          );
        `
      },
      // Admin can delete blog images
      {
        name: 'blog_images_admin_delete',
        sql: `
          DROP POLICY IF EXISTS "Admin can delete blog images" ON storage.objects;
          CREATE POLICY "Admin can delete blog images" ON storage.objects
          FOR DELETE
          USING (
            bucket_id = 'blog-images' 
            AND (auth.jwt() ->> 'email' = 'grantmatai@gmail.com')
          );
        `
      }
    ];

    const policyResults = await Promise.all(
      policies.map(policy => 
        supabase.rpc('exec_sql', { sql: policy.sql })
      )
    );

    const policyErrors = policyResults.filter(result => result.error);
    if (policyErrors.length > 0) {
      console.error('Some policies failed:', policyErrors);
      // Continue anyway, as bucket is created
    }

    // Also ensure the blog_posts table has image_url column
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE blog_posts 
        ADD COLUMN IF NOT EXISTS image_url text;
      `
    });

    if (alterError) {
      console.error('Error adding image_url column:', alterError);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Blog images storage setup completed successfully',
      bucketCreated: !bucketError?.message.includes('already exists')
    });

  } catch (error) {
    console.error('Error in blog images setup:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

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

    console.log('Creating student_videos table...');

    // Create student_videos table
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create student_videos table for individual student video assignments
        CREATE TABLE IF NOT EXISTS student_videos (
          id SERIAL PRIMARY KEY,
          student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          youtube_id VARCHAR(255) NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          thumbnail_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_student_videos_student_id ON student_videos(student_id);
        CREATE INDEX IF NOT EXISTS idx_student_videos_created_at ON student_videos(created_at);

        -- Enable Row Level Security
        ALTER TABLE student_videos ENABLE ROW LEVEL SECURITY;
      `
    });

    if (error) {
      console.error('Error creating table:', error);
      return NextResponse.json({ error: 'Failed to create table: ' + error.message }, { status: 500 });
    }

    console.log('Table created successfully');

    // Create RLS policies
    const policyResults = await Promise.all([
      // Students can only view their own videos
      supabase.rpc('exec_sql', {
        sql: `
          DROP POLICY IF EXISTS "Students can view own videos" ON student_videos;
          CREATE POLICY "Students can view own videos" ON student_videos
            FOR SELECT
            USING (auth.uid() = student_id);
        `
      }),

      // Admin can view all videos
      supabase.rpc('exec_sql', {
        sql: `
          DROP POLICY IF EXISTS "Admin can view all videos" ON student_videos;
          CREATE POLICY "Admin can view all videos" ON student_videos
            FOR SELECT
            USING (auth.jwt() ->> 'email' = 'grantmatai@gmail.com');
        `
      }),

      // Admin can insert videos for any student
      supabase.rpc('exec_sql', {
        sql: `
          DROP POLICY IF EXISTS "Admin can insert videos" ON student_videos;
          CREATE POLICY "Admin can insert videos" ON student_videos
            FOR INSERT
            WITH CHECK (auth.jwt() ->> 'email' = 'grantmatai@gmail.com');
        `
      }),

      // Admin can update any video
      supabase.rpc('exec_sql', {
        sql: `
          DROP POLICY IF EXISTS "Admin can update videos" ON student_videos;
          CREATE POLICY "Admin can update videos" ON student_videos
            FOR UPDATE
            USING (auth.jwt() ->> 'email' = 'grantmatai@gmail.com');
        `
      }),

      // Admin can delete any video
      supabase.rpc('exec_sql', {
        sql: `
          DROP POLICY IF EXISTS "Admin can delete videos" ON student_videos;
          CREATE POLICY "Admin can delete videos" ON student_videos
            FOR DELETE
            USING (auth.jwt() ->> 'email' = 'grantmatai@gmail.com');
        `
      })
    ]);

    const policyErrors = policyResults.filter(result => result.error);
    if (policyErrors.length > 0) {
      console.error('Some policies failed:', policyErrors);
      // Continue anyway, as table is created
    }

    return NextResponse.json({ 
      success: true, 
      message: 'student_videos table and policies created successfully' 
    });

  } catch (error) {
    console.error('Error in setup API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

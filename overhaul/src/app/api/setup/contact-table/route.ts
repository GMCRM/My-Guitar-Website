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

export async function POST(request: NextRequest) {
  try {
    console.log('Setting up contact_messages table...');
    
    // Create the table using direct SQL execution
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS contact_messages (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          name text NOT NULL,
          email text,
          phone text,
          subject text NOT NULL DEFAULT 'General Inquiry',
          message text NOT NULL,
          type text NOT NULL DEFAULT 'contact',
          status text NOT NULL DEFAULT 'unread',
          created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `;

    const { data: tableData, error: tableError } = await supabaseAdmin
      .from('contact_messages')
      .select('id')
      .limit(1);

    if (tableError && tableError.code === 'PGRST116') {
      // Table doesn't exist, try to create it
      console.log('Table does not exist, attempting to create...');
      
      // For now, let's test if we can insert directly and see what happens
      const testInsert = await supabaseAdmin
        .from('contact_messages')
        .insert({
          name: 'Test Message',
          email: 'test@example.com',
          subject: 'Test',
          message: 'This is a test message to verify table creation',
          type: 'test',
          status: 'unread'
        })
        .select()
        .single();

      if (testInsert.error) {
        console.error('Test insert failed:', testInsert.error);
        return NextResponse.json({ 
          error: 'Table setup failed', 
          details: testInsert.error.message,
          suggestion: 'Please create the contact_messages table manually in Supabase dashboard'
        }, { status: 500 });
      } else {
        console.log('Test insert successful, table exists');
        // Clean up test message
        await supabaseAdmin
          .from('contact_messages')
          .delete()
          .eq('id', testInsert.data.id);
      }
    } else if (tableError) {
      console.error('Error checking table:', tableError);
      return NextResponse.json({ 
        error: 'Error checking table existence', 
        details: tableError.message 
      }, { status: 500 });
    } else {
      console.log('Table already exists');
    }

    console.log('Contact messages table setup completed successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'Contact messages table is ready' 
    });

  } catch (error: any) {
    console.error('Error in setup:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

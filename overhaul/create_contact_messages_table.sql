-- Create contact_messages table for storing contact form submissions
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
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS contact_messages_status_idx ON contact_messages(status);
CREATE INDEX IF NOT EXISTS contact_messages_type_idx ON contact_messages(type);
-- Enable Row Level Security (RLS)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admin can read all contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Admin can update contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Admin can delete contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON contact_messages;
-- Policy for admin users to read all messages
CREATE POLICY "Admin can read all contact messages" ON contact_messages FOR
SELECT USING (
        auth.jwt()->>'email' = 'grantmatai@gmail.com'
    );
-- Policy for admin users to update message status
CREATE POLICY "Admin can update contact messages" ON contact_messages FOR
UPDATE USING (
        auth.jwt()->>'email' = 'grantmatai@gmail.com'
    );
-- Policy for admin users to delete messages
CREATE POLICY "Admin can delete contact messages" ON contact_messages FOR DELETE USING (
    auth.jwt()->>'email' = 'grantmatai@gmail.com'
);
-- Policy for anyone to submit contact messages (no auth required for public contact form)
CREATE POLICY "Anyone can submit contact messages" ON contact_messages FOR
INSERT WITH CHECK (true);
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = timezone('utc'::text, now());
RETURN NEW;
END;
$$ language 'plpgsql';
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_contact_messages_updated_at ON contact_messages;
-- Create updated_at trigger
CREATE TRIGGER update_contact_messages_updated_at BEFORE
UPDATE ON contact_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
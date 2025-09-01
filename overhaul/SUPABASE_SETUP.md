# Supabase Database Setup for Guitar Teacher Blog

## 1. Create Supabase Project

1. Go to https://supabase.com
2. Create a new project
3. Note down your project URL and anon key

## 2. Database Tables

Run these SQL commands in your Supabase SQL Editor:

### Blog Posts Table

```sql
CREATE TABLE blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'Grant Matai Cross',
  published_at TIMESTAMPTZ,
  read_time TEXT DEFAULT '5 min read',
  tags TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT false,
  image_url TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Subscribers Table

```sql
CREATE TABLE subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);
```

### Update Timestamps Function

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 3. Row Level Security (RLS)

### Enable RLS

```sql
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
```

### Blog Posts Policies

```sql
-- Allow public to read published posts
CREATE POLICY "Allow public to read published posts" ON blog_posts
  FOR SELECT
  USING (published = true);

-- Allow authenticated users to read all posts (for admin)
CREATE POLICY "Allow authenticated users to read all posts" ON blog_posts
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert posts (for admin)
CREATE POLICY "Allow authenticated users to insert posts" ON blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update posts (for admin)
CREATE POLICY "Allow authenticated users to update posts" ON blog_posts
  FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users to delete posts (for admin)
CREATE POLICY "Allow authenticated users to delete posts" ON blog_posts
  FOR DELETE
  TO authenticated
  USING (true);
```

### Subscribers Policies

```sql
-- Allow anyone to subscribe (insert)
CREATE POLICY "Allow anyone to subscribe" ON subscribers
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to read subscribers (for admin)
CREATE POLICY "Allow authenticated users to read subscribers" ON subscribers
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update subscribers (for admin)
CREATE POLICY "Allow authenticated users to update subscribers" ON subscribers
  FOR UPDATE
  TO authenticated
  USING (true);
```

## 4. Storage Setup

### Create Storage Bucket for Blog Images

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true);
```

### Storage Policies

```sql
-- Allow public to view blog images
CREATE POLICY "Allow public to view blog images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'blog-images');

-- Allow authenticated users to upload blog images
CREATE POLICY "Allow authenticated users to upload blog images" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'blog-images');

-- Allow authenticated users to update blog images
CREATE POLICY "Allow authenticated users to update blog images" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'blog-images');

-- Allow authenticated users to delete blog images
CREATE POLICY "Allow authenticated users to delete blog images" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'blog-images');
```

## 5. Environment Variables

Update your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_BLOG_ADMIN_EMAIL=your_email@example.com
```

## 6. Create Admin User

1. Go to your Supabase Authentication section
2. Create a new user with your email address
3. This will be your admin account for the blog

## 7. Test the Setup

1. Start your Next.js app: `npm run dev`
2. Go to `/admin` to test the admin login
3. Create your first blog post!

## Features Included:

✅ **Admin Authentication**: Only you can access the admin panel
✅ **Rich Text Editor**: Beautiful editor with formatting options
✅ **Image Uploads**: Upload and manage blog post images
✅ **Draft/Publish System**: Save drafts and publish when ready
✅ **Featured Posts**: Mark posts as featured for homepage
✅ **Tag System**: Organize posts with tags
✅ **Newsletter Signup**: Collect email subscribers
✅ **Responsive Design**: Works perfectly on all devices
✅ **SEO Ready**: Proper meta tags and structure

## Security Features:

🔒 **Row Level Security**: Database-level security
🔒 **Admin-Only Access**: Only your email can access admin features
🔒 **File Upload Security**: Secure image storage
🔒 **Authentication**: Supabase auth system

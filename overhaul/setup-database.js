#!/usr/bin/env node

// Supabase Database Setup Script
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("🎸 Guitar Teacher Website - Supabase Database Setup");
console.log("==================================================\n");

console.log("📋 INSTRUCTIONS:");
console.log("1. Go to your Supabase project dashboard");
console.log("2. Navigate to SQL Editor (in the sidebar)");
console.log("3. Copy and paste the SQL commands below");
console.log("4. Run each command one at a time\n");

console.log("🔗 Your Supabase Dashboard:");
console.log("https://supabase.com/dashboard/project/ckeoyzdnwywqyrmeelpy\n");

console.log("📝 SQL COMMANDS TO RUN:\n");

console.log("-- Step 1: Create blog_posts table");
console.log(`CREATE TABLE blog_posts (
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
);\n`);

console.log("-- Step 2: Create subscribers table");
console.log(`CREATE TABLE subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);\n`);

console.log("-- Step 3: Create update trigger function");
console.log(`CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_blog_posts_updated_at 
    BEFORE UPDATE ON blog_posts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();\n`);

console.log("-- Step 4: Enable Row Level Security");
console.log(`ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;\n`);

console.log("-- Step 5: Create RLS policies for blog_posts");
console.log(`-- Allow public to read published posts
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
  USING (true);\n`);

console.log("-- Step 6: Create RLS policies for subscribers");
console.log(`-- Allow anyone to subscribe (insert)
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
  USING (true);\n`);

console.log("-- Step 7: Create storage bucket for blog images");
console.log(`INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true);\n`);

console.log("-- Step 8: Create storage policies");
console.log(`-- Allow public to view blog images
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
  USING (bucket_id = 'blog-images');\n`);

console.log("🎉 AFTER RUNNING ALL SQL COMMANDS:");
console.log("1. Go to Authentication → Users");
console.log('2. Click "Add user" → "Create new user"');
console.log("3. Enter your email: grantmatai@gmail.com");
console.log("4. Set a password (you can change it later)");
console.log('5. Click "Create user"\n');

console.log("✅ THEN TEST YOUR SETUP:");
console.log("1. Visit: http://localhost:3001/admin");
console.log("2. Sign in with your email and password");
console.log("3. Create your first blog post!\n");

rl.question("Press Enter when you have completed the database setup...", () => {
  console.log("\n🚀 Great! Your database should now be ready.");
  console.log("Visit http://localhost:3001/admin to start using your blog!");
  rl.close();
});

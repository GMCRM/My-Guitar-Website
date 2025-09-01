import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for TypeScript
export interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  author: string
  published_at: string
  read_time: string
  tags: string[]
  featured: boolean
  image_url?: string
  created_at: string
  updated_at: string
  published: boolean
}

export interface Subscriber {
  id: string
  email: string
  subscribed_at: string
  active: boolean
}

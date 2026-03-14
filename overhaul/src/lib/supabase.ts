import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const browserSessionStorage = typeof window !== 'undefined' ? window.sessionStorage : undefined

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: browserSessionStorage
  }
})

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

// Three-tier system types
export interface TeacherPermissions {
  can_manage_blog: boolean
  can_manage_materials: boolean
  can_assign_practice: boolean
  can_view_analytics: boolean
  can_manage_students: boolean
  can_upload_videos: boolean
  can_manage_messages: boolean
}

export interface Teacher {
  id: string
  student_id: string
  email: string
  created_at: string
  created_by?: string
  is_active: boolean
  permissions: TeacherPermissions
}

export interface Student {
  id: string
  email: string
  name: string
  created_at: string
  assigned_teacher_id?: string
  analytics_opt_in?: boolean
}

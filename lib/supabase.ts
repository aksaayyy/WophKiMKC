// Supabase client configuration for Video Clipper Pro - Singleton Pattern
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://imrlhhpsvxtuklxfuwlt.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcmxoaHBzdnh0dWtseGZ1d2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NTY3MDgsImV4cCI6MjA3NzEzMjcwOH0.0x1apb5w4MxA6BYCJanPlsgPD0kn5qzzRnornshNQzg'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcmxoaHBzdnh0dWtseGZ1d2x0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTU1NjcwOCwiZXhwIjoyMDc3MTMyNzA4fQ.5WX5ctx_YSvbbxgY7hsuppZDHyYTNbh31lMbplYThUY'

// Singleton instances
let supabaseInstance: SupabaseClient | null = null
let supabaseAdminInstance: SupabaseClient | null = null

// Create Supabase client for client-side operations (singleton)
export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'video-clipper-auth'
      }
    })
  }
  return supabaseInstance
})()

// Create Supabase admin client for server-side operations (singleton)
export const supabaseAdmin = (() => {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return supabaseAdminInstance
})()

export default supabase
// Supabase client configuration for Video Clipper Pro - Singleton Pattern
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://imrlhhpsvxtuklxfuwlt.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcmxoaHBzdnh0dWtseGZ1d2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NTY3MDgsImV4cCI6MjA3NzEzMjcwOH0.0x1apb5w4MxA6BYCJanPlsgPD0kn5qzzRnornshNQzg'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcmxoaHBzdnh0dWtseGZ1d2x0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTU1NjcwOCwiZXhwIjoyMDc3MTMyNzA4fQ.5WX5ctx_YSvbbxgY7hsuppZDHyYTNbh31lMbplYThUY'

// Singleton instances - using a global variable to ensure true singleton across hot reloads
declare global {
  var __supabaseClient: SupabaseClient | undefined
  var __supabaseAdminClient: SupabaseClient | undefined
}

// Create Supabase client for client-side operations (singleton)
export const supabase = (() => {
  if (typeof window === 'undefined') {
    // Server-side: create new instance each time
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    })
  }
  
  // Client-side: use singleton
  if (!global.__supabaseClient) {
    global.__supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'video-clipper-auth',
        flowType: 'pkce'
      },
      global: {
        headers: {
          'x-client-info': 'video-clipper-pro'
        },
        fetch: (url, options = {}) => {
          // Add timeout to fetch requests
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
          
          return fetch(url, {
            ...options,
            signal: controller.signal
          }).finally(() => clearTimeout(timeoutId))
        }
      }
    })
  }
  return global.__supabaseClient
})()

// Create Supabase admin client for server-side operations (singleton)
export const supabaseAdmin = (() => {
  if (!global.__supabaseAdminClient) {
    global.__supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return global.__supabaseAdminClient
})()

export default supabase
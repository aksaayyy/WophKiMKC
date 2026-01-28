'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

export interface AuthUser {
  id: string
  email?: string
  subscription_tier: 'free' | 'pro' | 'business'
  team_id?: string
  email_confirmed: boolean
  created_at: string
  updated_at: string
}

export interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  clearSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session with error handling
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('Session error, clearing:', error.message)
        // Clear invalid session
        supabase.auth.signOut().catch(() => {})
        setSession(null)
        setUser(null)
        setLoading(false)
        return
      }
      
      setSession(session)
      if (session?.user) {
        fetchUserProfile(session.user.id, session.access_token)
      } else {
        setLoading(false)
      }
    }).catch((error) => {
      console.warn('Failed to get session:', error)
      // Clear any corrupted session data
      supabase.auth.signOut().catch(() => {})
      setSession(null)
      setUser(null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Handle token refresh errors
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.warn('Token refresh failed, clearing session')
        setSession(null)
        setUser(null)
        setLoading(false)
        return
      }
      
      if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setLoading(false)
        return
      }
      
      setSession(session)
      
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.access_token)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (_userId: string, accessToken?: string) => {
    try {
      // Get the access token
      let token = accessToken
      if (!token) {
        const { data: { session: freshSession } } = await supabase.auth.getSession()
        token = freshSession?.access_token
      }

      if (!token) {
        console.error('No access token available')
        setUser(null)
        setLoading(false)
        return
      }

      const response = await fetch('/api/v1/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        console.error('Failed to fetch user profile:', response.status)
        setUser(null)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      
      // Use Supabase client directly for authentication
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        return { error: authError.message }
      }

      if (!authData.user || !authData.session) {
        return { error: 'Authentication failed' }
      }

      // The session will be automatically set via the auth state change listener
      // But we can also set it immediately for faster UI updates
      setSession(authData.session)
      
      // Fetch user profile
      await fetchUserProfile(authData.user.id, authData.session.access_token)
      
      return {}
    } catch (error) {
      console.error('Sign in error:', error)
      return { error: 'Network error occurred' }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        return {}
      } else {
        return { error: data.error || 'Registration failed' }
      }
    } catch (error) {
      console.error('Sign up error:', error)
      return { error: 'Network error occurred' }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const refreshUser = async () => {
    if (session?.user) {
      await fetchUserProfile(session.user.id)
    }
  }

  const clearSession = async () => {
    try {
      // Clear Supabase session
      await supabase.auth.signOut()
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('video-clipper-auth')
        localStorage.removeItem('sb-imrlhhpsvxtuklxfuwlt-auth-token')
      }
      
      setUser(null)
      setSession(null)
      console.log('Session cleared successfully')
    } catch (error) {
      console.error('Error clearing session:', error)
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
    clearSession
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
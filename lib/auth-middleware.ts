import { NextRequest } from 'next/server'
import { supabase } from './supabase'
import { UserManager } from './database'
import { User as AuthUser } from '@supabase/supabase-js'
import { User as DatabaseUser } from '../../types/database'

export interface AuthenticatedUser {
  auth: AuthUser
  profile: DatabaseUser
}

export interface AuthError {
  error: string
  status: number
}

export type AuthResult = AuthenticatedUser | AuthError

/**
 * Authenticate user from request headers and return user data
 */
export async function authenticateUser(request: NextRequest): Promise<AuthResult> {
  try {
    const authorization = request.headers.get('authorization')
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return { error: 'Missing or invalid Authorization header', status: 401 }
    }

    const token = authorization.replace('Bearer ', '')

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return { error: 'Invalid or expired session', status: 401 }
    }

    // Get user profile from database
    let userProfile = await UserManager.getUserProfile(user.id)

    // Create profile if it doesn't exist (for new users)
    if (!userProfile) {
      userProfile = await UserManager.createUserProfile(
        user.id,
        user.email || '',
        'free'
      )
      
      if (!userProfile) {
        return { error: 'Failed to create user profile', status: 500 }
      }
    }

    return {
      auth: user,
      profile: userProfile
    }

  } catch (error) {
    console.error('Authentication error:', error)
    return { error: 'Authentication failed', status: 500 }
  }
}

/**
 * Check if user has required subscription tier
 */
export function hasRequiredTier(user: DatabaseUser, requiredTier: 'free' | 'pro' | 'business'): boolean {
  const tierHierarchy = { free: 0, pro: 1, business: 2 }
  return tierHierarchy[user.subscription_tier] >= tierHierarchy[requiredTier]
}

/**
 * Validate API key format (for backward compatibility)
 */
export function validateApiKey(apiKey: string): boolean {
  return Boolean(apiKey && apiKey.startsWith('vcp_') && apiKey.length >= 20)
}

/**
 * Extract user ID from API key (for backward compatibility)
 * In production, this should query the database
 */
export function getUserIdFromApiKey(apiKey: string): string | null {
  // This is a placeholder implementation
  // In production, you would query the database to get the user ID associated with the API key
  if (!validateApiKey(apiKey)) {
    return null
  }
  
  // For now, return a mock user ID
  // TODO: Implement proper API key to user ID mapping
  return 'mock-user-id'
}

/**
 * Rate limiting helper (simple in-memory store - use Redis in production)
 */
const rateLimits = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string, 
  limit: number = 100, 
  windowMs: number = 60 * 60 * 1000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const current = rateLimits.get(identifier)
  
  if (!current || now > current.resetTime) {
    const resetTime = now + windowMs
    rateLimits.set(identifier, { count: 1, resetTime })
    return { allowed: true, remaining: limit - 1, resetTime }
  }
  
  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: current.resetTime }
  }
  
  current.count++
  return { allowed: true, remaining: limit - current.count, resetTime: current.resetTime }
}

/**
 * Get rate limit based on subscription tier
 */
export function getTierRateLimit(tier: 'free' | 'pro' | 'business'): number {
  const limits = {
    free: 10,      // 10 requests per hour
    pro: 100,      // 100 requests per hour
    business: 1000 // 1000 requests per hour
  }
  return limits[tier]
}

/**
 * Subscription tier enforcement
 */
export interface TierLimits {
  clips_per_month: number
  processing_time_minutes: number
  storage_gb: number
  team_members: number
  api_requests_per_hour: number
}

export const TIER_LIMITS: Record<'free' | 'pro' | 'business', TierLimits> = {
  free: {
    clips_per_month: 10,
    processing_time_minutes: 60,
    storage_gb: 1,
    team_members: 1,
    api_requests_per_hour: 10
  },
  pro: {
    clips_per_month: 100,
    processing_time_minutes: 600,
    storage_gb: 10,
    team_members: 5,
    api_requests_per_hour: 100
  },
  business: {
    clips_per_month: 1000,
    processing_time_minutes: 6000,
    storage_gb: 100,
    team_members: 25,
    api_requests_per_hour: 1000
  }
}

/**
 * Validate request against subscription tier limits
 */
export function validateTierAccess(
  user: DatabaseUser,
  requiredTier: 'free' | 'pro' | 'business'
): { allowed: boolean; message?: string } {
  if (!hasRequiredTier(user, requiredTier)) {
    return {
      allowed: false,
      message: `This feature requires ${requiredTier} subscription or higher. Current tier: ${user.subscription_tier}`
    }
  }
  
  return { allowed: true }
}
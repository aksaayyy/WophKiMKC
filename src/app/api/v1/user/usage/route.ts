import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../../../lib/supabase'
import { UserManager, UsageTracker } from '../../../../../../lib/database'

// Authentication middleware
async function authenticateUser(request: NextRequest) {
  const authorization = request.headers.get('authorization')
  
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header', status: 401 }
  }

  const token = authorization.replace('Bearer ', '')

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return { error: 'Invalid session', status: 401 }
  }

  return { user }
}

// GET /api/v1/user/usage - Get user usage statistics and limits
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request)
    
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { user } = authResult

    // Get user profile to determine subscription tier
    const userProfile = await UserManager.getUserProfile(user.id)

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Get usage limits and current usage
    const usageCheck = await UsageTracker.checkUsageLimits(user.id, userProfile.subscription_tier)

    return NextResponse.json(
      {
        subscription_tier: userProfile.subscription_tier,
        can_process: usageCheck.canProcess,
        current_usage: usageCheck.usage || {
          clips_processed: 0,
          processing_time: 0,
          storage_used: 0,
          period_month: new Date().getMonth() + 1,
          period_year: new Date().getFullYear()
        },
        limits: {
          clips_per_month: usageCheck.limits.clips_per_month,
          processing_time_minutes: usageCheck.limits.processing_time_minutes,
          storage_gb: usageCheck.limits.storage_gb,
          team_members: usageCheck.limits.team_members
        },
        usage_percentage: {
          clips: usageCheck.usage ? 
            Math.round((usageCheck.usage.clips_processed / usageCheck.limits.clips_per_month) * 100) : 0,
          processing_time: usageCheck.usage ? 
            Math.round((usageCheck.usage.processing_time / (usageCheck.limits.processing_time_minutes * 60)) * 100) : 0,
          storage: usageCheck.usage ? 
            Math.round((usageCheck.usage.storage_used / (usageCheck.limits.storage_gb * 1024 * 1024 * 1024)) * 100) : 0
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Get usage error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/v1/user/usage/check - Check if user can process a video
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request)
    
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { user } = authResult
    const body = await request.json()
    const { clip_count = 1, estimated_processing_time = 120, estimated_storage = 0 } = body

    // Get user profile to determine subscription tier
    const userProfile = await UserManager.getUserProfile(user.id)

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check current usage limits
    const usageCheck = await UsageTracker.checkUsageLimits(user.id, userProfile.subscription_tier)

    if (!usageCheck.canProcess) {
      return NextResponse.json(
        {
          can_process: false,
          reason: 'Usage limits exceeded',
          current_usage: usageCheck.usage,
          limits: usageCheck.limits
        },
        { status: 429 }
      )
    }

    // Check if the new request would exceed limits
    const currentUsage = usageCheck.usage || {
      clips_processed: 0,
      processing_time: 0,
      storage_used: 0
    }

    const wouldExceedClips = (currentUsage.clips_processed + clip_count) > usageCheck.limits.clips_per_month
    const wouldExceedTime = (currentUsage.processing_time + estimated_processing_time) > (usageCheck.limits.processing_time_minutes * 60)
    const wouldExceedStorage = (currentUsage.storage_used + estimated_storage) > (usageCheck.limits.storage_gb * 1024 * 1024 * 1024)

    if (wouldExceedClips || wouldExceedTime || wouldExceedStorage) {
      return NextResponse.json(
        {
          can_process: false,
          reason: 'Request would exceed usage limits',
          would_exceed: {
            clips: wouldExceedClips,
            processing_time: wouldExceedTime,
            storage: wouldExceedStorage
          },
          current_usage: currentUsage,
          limits: usageCheck.limits
        },
        { status: 429 }
      )
    }

    return NextResponse.json(
      {
        can_process: true,
        current_usage: currentUsage,
        limits: usageCheck.limits,
        estimated_usage_after: {
          clips_processed: currentUsage.clips_processed + clip_count,
          processing_time: currentUsage.processing_time + estimated_processing_time,
          storage_used: currentUsage.storage_used + estimated_storage
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Check usage error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '../../../../../../lib/supabase'
import { UserManager, UsageTracker } from '../../../../../../lib/database'
import { SubscriptionTier } from '../../../../../../../types/database'

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

// GET /api/v1/user/profile - Get user profile
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

    // Try to get user profile using admin client (bypasses RLS)
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    let finalProfile = userProfile

    if (profileError && profileError.code === 'PGRST116') {
      // Create user profile if it doesn't exist
      finalProfile = await UserManager.createUserProfile(
        user.id,
        user.email || '',
        'free'
      )
      
      if (!finalProfile) {
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        )
      }
    } else if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    // Get current usage statistics
    const usage = await UsageTracker.getUserUsage(user.id)

    return NextResponse.json(
      {
        user: {
          id: finalProfile.id,
          email: finalProfile.email,
          subscription_tier: finalProfile.subscription_tier,
          team_id: finalProfile.team_id,
          created_at: finalProfile.created_at,
          updated_at: finalProfile.updated_at
        },
        usage: usage || {
          clips_processed: 0,
          processing_time: 0,
          storage_used: 0,
          period_month: new Date().getMonth() + 1,
          period_year: new Date().getFullYear()
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/v1/user/profile - Update user profile
export async function PUT(request: NextRequest) {
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
    const { subscription_tier, team_id } = body

    // Validate subscription tier if provided
    if (subscription_tier) {
      const validTiers: SubscriptionTier[] = ['free', 'pro', 'business']
      if (!validTiers.includes(subscription_tier)) {
        return NextResponse.json(
          { error: 'Invalid subscription tier' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (subscription_tier) updateData.subscription_tier = subscription_tier
    if (team_id !== undefined) updateData.team_id = team_id

    // Update user profile
    const updatedProfile = await UserManager.updateUserProfile(user.id, updateData)

    if (!updatedProfile) {
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Profile updated successfully',
        user: {
          id: updatedProfile.id,
          email: updatedProfile.email,
          subscription_tier: updatedProfile.subscription_tier,
          team_id: updatedProfile.team_id,
          created_at: updatedProfile.created_at,
          updated_at: updatedProfile.updated_at
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
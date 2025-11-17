import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../../../lib/supabase'
import { UserManager } from '../../../../../../lib/database'
import { SubscriptionTier } from '../../../../../../../types/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, subscription_tier = 'free' } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Validate subscription tier
    const validTiers: SubscriptionTier[] = ['free', 'pro', 'business']
    if (!validTiers.includes(subscription_tier)) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      )
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Disable email confirmation for now
        data: {
          subscription_tier
        }
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Try to get or create user profile in database
    let userProfile = await UserManager.getUserProfile(authData.user.id)
    
    if (!userProfile) {
      // If profile doesn't exist, try to create it
      userProfile = await UserManager.createUserProfile(
        authData.user.id,
        email,
        subscription_tier
      )
    }

    // If still no profile, create a default one for the response
    if (!userProfile) {
      userProfile = {
        id: authData.user.id,
        email: email,
        subscription_tier: subscription_tier
      }
    }

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          subscription_tier: userProfile.subscription_tier,
          email_confirmed: authData.user.email_confirmed_at !== null
        },
        session: authData.session
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
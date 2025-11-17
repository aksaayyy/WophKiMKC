import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../../../lib/supabase'
import { UserManager } from '../../../../../../lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 401 }
      )
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    // Get user profile from database
    const userProfile = await UserManager.getUserProfile(authData.user.id)

    if (!userProfile) {
      // If user profile doesn't exist, create it
      const newProfile = await UserManager.createUserProfile(
        authData.user.id, 
        authData.user.email || '', 
        'free'
      )
      
      if (!newProfile) {
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        {
          message: 'Login successful',
          user: {
            id: authData.user.id,
            email: authData.user.email,
            subscription_tier: newProfile.subscription_tier,
            team_id: newProfile.team_id,
            email_confirmed: authData.user.email_confirmed_at !== null,
            created_at: newProfile.created_at,
            updated_at: newProfile.updated_at
          },
          session: authData.session
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          subscription_tier: userProfile.subscription_tier,
          team_id: userProfile.team_id,
          email_confirmed: authData.user.email_confirmed_at !== null,
          created_at: userProfile.created_at,
          updated_at: userProfile.updated_at
        },
        session: authData.session
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
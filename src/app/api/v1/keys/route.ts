import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../../lib/supabase'

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

// Simple API key generation endpoint
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
    const { plan = 'free' } = body
    
    // Generate API key
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 15)
    const apiKey = `vcp_${timestamp}${random}`
    
    // In production, store in database with user info
    const keyInfo = {
      api_key: apiKey,
      email: user.email,
      user_id: user.id,
      plan,
      created_at: new Date().toISOString(),
      status: 'active',
      requests_limit: plan === 'free' ? 100 : plan === 'pro' ? 1000 : 10000,
      requests_used: 0,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    }
    
    return NextResponse.json({
      message: 'API key generated successfully',
      ...keyInfo
    }, { status: 201 })
    
  } catch (error) {
    console.error('Key generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get API key info
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
    const { searchParams } = new URL(request.url)
    const apiKey = searchParams.get('key')
    
    // Validate key exists and format
    if (!apiKey || !apiKey.startsWith('vcp_') || apiKey.length < 20) {
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 400 }
      )
    }
    
    // In production, fetch from database
    // For demo, return mock data
    const keyInfo = {
      api_key: apiKey,
      plan: 'pro',
      status: 'active',
      requests_limit: 1000,
      requests_used: 153,
      requests_remaining: 847,
      created_at: '2025-01-27T10:00:00Z',
      expires_at: '2025-02-27T10:00:00Z',
      last_used: new Date().toISOString()
    }
    
    return NextResponse.json(keyInfo)
    
  } catch (error) {
    console.error('Key info error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
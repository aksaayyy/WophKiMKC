/**
 * Admin User Management API
 * Allows admins to view and manage users
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../../lib/supabase'

function isAdminUser(email?: string): boolean {
  if (!email) return false
  return email.includes('admin') || email === 'admin@videoclipper.com'
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user || !isAdminUser(user.email)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || ''

    // For now, return mock data since we can't access auth.admin without proper service role
    const mockUsers = [
      {
        id: user.id,
        email: user.email || 'admin@videoclipper.com',
        created_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        video_jobs: [{ count: 0 }]
      }
    ]

    // Apply search filter
    let filteredUsers = mockUsers
    if (search) {
      filteredUsers = mockUsers.filter(u => 
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    }

    return NextResponse.json({
      users: filteredUsers,
      pagination: {
        limit,
        offset,
        total: filteredUsers.length
      }
    })

  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete user (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: deleteAuthError } = await supabaseAdmin.auth.getUser(token)

    if (deleteAuthError || !user || !isAdminUser(user.email)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // For now, just return success (would need proper service role key for actual deletion)
    return NextResponse.json({ 
      success: true,
      message: 'User deletion would require proper service role configuration'
    })

  } catch (error) {
    console.error('Admin delete user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
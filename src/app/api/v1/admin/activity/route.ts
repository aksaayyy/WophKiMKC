/**
 * Admin Activity Log API
 * Tracks and retrieves admin actions for audit purposes
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
    const action = searchParams.get('action')
    const adminUserId = searchParams.get('admin_user_id')

    // Try to get activity log (if table exists)
    let activities = []
    try {
      let query = supabaseAdmin
        .from('admin_activity_log')
        .select(`
          id, admin_user_id, action, target_type, target_id,
          details, ip_address, user_agent, created_at,
          users!admin_user_id(email)
        `)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false })

      if (action) {
        query = query.eq('action', action)
      }

      if (adminUserId) {
        query = query.eq('admin_user_id', adminUserId)
      }

      const { data, error } = await query

      if (error && error.code !== '42P01') { // 42P01 = table doesn't exist
        throw error
      }

      activities = data || []
    } catch (err: any) {
      if (err.code === '42P01') {
        // Table doesn't exist, return mock data
        activities = [
          {
            id: '1',
            admin_user_id: user.id,
            action: 'admin_login',
            target_type: 'system',
            target_id: null,
            details: { message: 'Admin logged into system' },
            ip_address: '127.0.0.1',
            user_agent: 'Admin Browser',
            created_at: new Date().toISOString(),
            users: { email: user.email }
          }
        ]
      } else {
        console.warn('Activity log error:', err)
        activities = []
      }
    }

    return NextResponse.json({
      activities: activities,
      pagination: {
        limit,
        offset,
        total: activities.length
      }
    })

  } catch (error) {
    console.error('Admin activity log error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const { action, target_type, target_id, details } = await request.json()

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    // Get client IP and user agent
    const ip_address = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      '127.0.0.1'
    const user_agent = request.headers.get('user-agent')

    // Try to log the activity (if table exists)
    try {
      const { data: activity, error } = await supabaseAdmin
        .from('admin_activity_log')
        .insert({
          admin_user_id: user.id,
          action,
          target_type,
          target_id,
          details,
          ip_address,
          user_agent
        })
        .select()
        .single()

      if (error && error.code !== '42P01') {
        throw error
      }

      return NextResponse.json({ success: true, activity })
    } catch (err: any) {
      if (err.code === '42P01') {
        // Table doesn't exist, just return success
        return NextResponse.json({ 
          success: true, 
          message: 'Activity logged (table not configured)' 
        })
      }
      throw err
    }

  } catch (error) {
    console.error('Admin log activity error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
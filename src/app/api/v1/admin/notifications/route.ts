/**
 * Admin Notifications API
 * Manages system notifications and alerts for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../../lib/supabase'

function isAdminUser(email?: string): boolean {
  if (!email) return false
  return email.includes('admin') || email === 'admin@videoclipper.com'
}

interface SystemNotification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  created_at: string
  read: boolean
  priority: 'low' | 'medium' | 'high'
  category: 'system' | 'user' | 'security' | 'maintenance'
}

// GET - Fetch notifications
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
    const unreadOnly = searchParams.get('unread_only') === 'true'
    const category = searchParams.get('category')

    // Try to get notifications from database (if table exists)
    let notifications: SystemNotification[] = []
    
    try {
      let query = supabaseAdmin
        .from('admin_notifications')
        .select('*')
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false })

      if (unreadOnly) {
        query = query.eq('read', false)
      }

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error && error.code !== '42P01') { // 42P01 = table doesn't exist
        throw error
      }

      notifications = data || []
    } catch (err: any) {
      if (err.code === '42P01') {
        // Table doesn't exist, return mock notifications
        notifications = [
          {
            id: '1',
            type: 'info',
            title: 'System Status',
            message: 'All systems are running normally',
            created_at: new Date().toISOString(),
            read: false,
            priority: 'low',
            category: 'system'
          },
          {
            id: '2',
            type: 'success',
            title: 'Admin Login',
            message: 'Admin user logged in successfully',
            created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            read: false,
            priority: 'medium',
            category: 'security'
          }
        ]
      } else {
        console.warn('Notifications error:', err)
        notifications = []
      }
    }

    return NextResponse.json({
      notifications,
      pagination: {
        limit,
        offset,
        total: notifications.length
      }
    })

  } catch (error) {
    console.error('Admin notifications error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create notification
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

    const { type, title, message, priority = 'medium', category = 'system' } = await request.json()

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Type, title, and message are required' },
        { status: 400 }
      )
    }

    // Try to create notification (if table exists)
    try {
      const { data: notification, error } = await supabaseAdmin
        .from('admin_notifications')
        .insert({
          type,
          title,
          message,
          priority,
          category,
          read: false
        })
        .select()
        .single()

      if (error && error.code !== '42P01') {
        throw error
      }

      return NextResponse.json({ success: true, notification })
    } catch (err: any) {
      if (err.code === '42P01') {
        // Table doesn't exist, just return success
        return NextResponse.json({ 
          success: true, 
          message: 'Notification created (table not configured)' 
        })
      }
      throw err
    }

  } catch (error) {
    console.error('Admin create notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Mark notifications as read
export async function PUT(request: NextRequest) {
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

    const { notification_ids, mark_all = false } = await request.json()

    if (!mark_all && (!notification_ids || !Array.isArray(notification_ids))) {
      return NextResponse.json(
        { error: 'notification_ids array is required or set mark_all to true' },
        { status: 400 }
      )
    }

    // Try to mark notifications as read (if table exists)
    try {
      let query = supabaseAdmin
        .from('admin_notifications')
        .update({ read: true })

      if (!mark_all) {
        query = query.in('id', notification_ids)
      }

      const { error } = await query

      if (error && error.code !== '42P01') {
        throw error
      }

      return NextResponse.json({ success: true })
    } catch (err: any) {
      if (err.code === '42P01') {
        // Table doesn't exist, just return success
        return NextResponse.json({ 
          success: true, 
          message: 'Notifications marked as read (table not configured)' 
        })
      }
      throw err
    }

  } catch (error) {
    console.error('Admin mark notifications read error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete notifications
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
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user || !isAdminUser(user.email)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { notification_ids, delete_all_read = false } = await request.json()

    if (!delete_all_read && (!notification_ids || !Array.isArray(notification_ids))) {
      return NextResponse.json(
        { error: 'notification_ids array is required or set delete_all_read to true' },
        { status: 400 }
      )
    }

    // Try to delete notifications (if table exists)
    try {
      let query = supabaseAdmin.from('admin_notifications').delete()

      if (delete_all_read) {
        query = query.eq('read', true)
      } else {
        query = query.in('id', notification_ids)
      }

      const { error } = await query

      if (error && error.code !== '42P01') {
        throw error
      }

      return NextResponse.json({ success: true })
    } catch (err: any) {
      if (err.code === '42P01') {
        // Table doesn't exist, just return success
        return NextResponse.json({ 
          success: true, 
          message: 'Notifications deleted (table not configured)' 
        })
      }
      throw err
    }

  } catch (error) {
    console.error('Admin delete notifications error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
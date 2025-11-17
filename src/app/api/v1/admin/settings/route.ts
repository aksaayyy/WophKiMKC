/**
 * Admin Settings API
 * Allows admins to view and update system settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../../lib/supabase'

function isAdminUser(email?: string): boolean {
  if (!email) return false
  return email.includes('admin') || email === 'admin@videoclipper.com'
}

interface SystemSettings {
  maxFileSize: number // in bytes
  maxClipsPerJob: number
  fileRetentionHours: number
  allowedFileTypes: string[]
  maintenanceMode: boolean
  maxConcurrentJobs: number
  defaultQuality: string
  enableYouTubeDownload: boolean
  enableTeamFeatures: boolean
  maxUsersPerTeam: number
}

const defaultSettings: SystemSettings = {
  maxFileSize: 500 * 1024 * 1024, // 500MB
  maxClipsPerJob: 10,
  fileRetentionHours: 48,
  allowedFileTypes: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
  maintenanceMode: false,
  maxConcurrentJobs: 5,
  defaultQuality: 'high',
  enableYouTubeDownload: true,
  enableTeamFeatures: true,
  maxUsersPerTeam: 10
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

    // Get settings from database or return defaults
    const { data: settings, error } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }

    return NextResponse.json(settings?.settings || defaultSettings)

  } catch (error) {
    console.error('Admin settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    const newSettings = await request.json()

    // Validate settings
    if (newSettings.maxFileSize && newSettings.maxFileSize > 2 * 1024 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Max file size cannot exceed 2GB' },
        { status: 400 }
      )
    }

    if (newSettings.maxClipsPerJob && newSettings.maxClipsPerJob > 50) {
      return NextResponse.json(
        { error: 'Max clips per job cannot exceed 50' },
        { status: 400 }
      )
    }

    // Upsert settings
    const { error } = await supabaseAdmin
      .from('system_settings')
      .upsert({
        id: 1, // Single row for system settings
        settings: newSettings,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, settings: newSettings })

  } catch (error) {
    console.error('Admin update settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
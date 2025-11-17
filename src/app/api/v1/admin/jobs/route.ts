/**
 * Admin Jobs Management API
 * Allows admins to view and manage all video jobs
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
    const status = searchParams.get('status')
    const search = searchParams.get('search') || ''

    // Try to get jobs from database (if table exists)
    let jobs: any[] = []
    
    try {
      let query = supabaseAdmin
        .from('video_jobs')
        .select(`
          id, user_id, status, original_filename, original_filesize,
          clip_count, quality_preset, platform_target, processing_time,
          created_at, started_at, completed_at, error_message,
          files_expired, files_expired_at, clips_generated
        `)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      if (search) {
        query = query.ilike('original_filename', `%${search}%`)
      }

      const { data, error } = await query

      if (error && error.code !== '42P01') { // 42P01 = table doesn't exist
        throw error
      }

      jobs = data || []
    } catch (err: any) {
      if (err.code === '42P01') {
        // Table doesn't exist, return mock data
        jobs = [
          {
            id: '1',
            user_id: user.id,
            status: 'completed',
            original_filename: 'sample_video.mp4',
            original_filesize: 50000000,
            clip_count: 3,
            quality_preset: 'high',
            platform_target: 'youtube',
            processing_time: 120,
            created_at: new Date().toISOString(),
            started_at: new Date(Date.now() - 300000).toISOString(),
            completed_at: new Date(Date.now() - 60000).toISOString(),
            error_message: null,
            files_expired: false,
            files_expired_at: null,
            clips_generated: 3
          }
        ]
      } else {
        console.warn('Jobs table error:', err)
        jobs = []
      }
    }



    // Get user emails for the jobs
    const userIds = [...new Set(jobs?.map(job => job.user_id).filter(Boolean))]
    const userEmails: Record<string, string> = {}
    
    if (userIds.length > 0) {
      try {
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
        authUsers.users.forEach(user => {
          if (userIds.includes(user.id)) {
            userEmails[user.id] = user.email || 'Unknown'
          }
        })
      } catch (err) {
        console.error('Failed to fetch user emails:', err)
      }
    }

    // Add user email to jobs
    const jobsWithUsers = jobs.map((job: any) => ({
      ...job,
      users: { email: userEmails[job.user_id] || user.email || 'Unknown' }
    }))

    // Apply search filter for user emails if needed
    const filteredJobs = search 
      ? jobsWithUsers.filter((job: any) => 
          job.original_filename.toLowerCase().includes(search.toLowerCase()) ||
          job.users.email.toLowerCase().includes(search.toLowerCase())
        )
      : jobsWithUsers

    return NextResponse.json({
      jobs: filteredJobs,
      pagination: {
        limit,
        offset,
        total: filteredJobs.length
      }
    })

  } catch (error) {
    console.error('Admin jobs error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete job (admin only)
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

    const { jobId } = await request.json()

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Try to delete job (if table exists)
    try {
      const { error: jobError } = await supabaseAdmin
        .from('video_jobs')
        .delete()
        .eq('id', jobId)

      if (jobError && jobError.code !== '42P01') {
        throw jobError
      }
    } catch (err: any) {
      if (err.code === '42P01') {
        // Table doesn't exist, just return success
        return NextResponse.json({ 
          success: true, 
          message: 'Job deleted (table not configured)' 
        })
      }
      throw err
    }



    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Admin delete job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update job status (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: patchAuthError } = await supabaseAdmin.auth.getUser(token)

    if (patchAuthError || !user || !isAdminUser(user.email)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { jobId, status, error_message } = await request.json()

    if (!jobId || !status) {
      return NextResponse.json(
        { error: 'Job ID and status are required' },
        { status: 400 }
      )
    }

    const updateData: any = { status }
    
    if (error_message) {
      updateData.error_message = error_message
    }

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    // Try to update job (if table exists)
    try {
      const { error: jobError } = await supabaseAdmin
        .from('video_jobs')
        .update(updateData)
        .eq('id', jobId)

      if (jobError && jobError.code !== '42P01') {
        throw jobError
      }
    } catch (err: any) {
      if (err.code === '42P01') {
        // Table doesn't exist, just return success
        return NextResponse.json({ 
          success: true, 
          message: 'Job updated (table not configured)' 
        })
      }
      throw err
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Admin update job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
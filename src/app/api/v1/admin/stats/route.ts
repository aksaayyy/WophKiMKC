/**
 * Admin Stats API
 * Provides basic system statistics for admin dashboard
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

    // Get total users from auth
    let totalUsers = 0
    try {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
      totalUsers = authUsers.users.length
    } catch (err) {
      console.warn('Failed to get user count:', err)
    }

    // Try to get job statistics (if video_jobs table exists)
    let jobStats = {
      totalJobs: 0,
      completedJobs: 0,
      processingJobs: 0,
      failedJobs: 0,
      totalStorage: 0,
      expiredFiles: 0,
      activeUsers: Math.floor(totalUsers * 0.3) // Estimate 30% active users
    }

    try {
      const [
        totalJobsResult,
        completedJobsResult,
        processingJobsResult,
        failedJobsResult,
        storageResult,
        expiredFilesResult
      ] = await Promise.all([
        supabaseAdmin.from('video_jobs').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('video_jobs').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
        supabaseAdmin.from('video_jobs').select('id', { count: 'exact', head: true }).eq('status', 'processing'),
        supabaseAdmin.from('video_jobs').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
        supabaseAdmin.from('video_jobs').select('original_filesize').not('original_filesize', 'is', null),
        supabaseAdmin.from('video_jobs').select('id', { count: 'exact', head: true }).eq('files_expired', true)
      ])

      jobStats = {
        totalJobs: totalJobsResult.count || 0,
        completedJobs: completedJobsResult.count || 0,
        processingJobs: processingJobsResult.count || 0,
        failedJobs: failedJobsResult.count || 0,
        totalStorage: storageResult.data?.reduce((sum: number, job: any) => sum + (job.original_filesize || 0), 0) || 0,
        expiredFiles: expiredFilesResult.count || 0,
        activeUsers: Math.floor(totalUsers * 0.3)
      }
    } catch (err) {
      console.warn('Video jobs table may not exist:', err)
    }

    // Determine system health
    const failureRate = jobStats.totalJobs > 0 ? (jobStats.failedJobs / jobStats.totalJobs) * 100 : 0
    
    let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy'
    if (failureRate > 20) {
      systemHealth = 'critical'
    } else if (failureRate > 10) {
      systemHealth = 'warning'
    }

    const stats = {
      totalUsers,
      totalJobs: jobStats.totalJobs,
      completedJobs: jobStats.completedJobs,
      processingJobs: jobStats.processingJobs,
      failedJobs: jobStats.failedJobs,
      totalStorage: jobStats.totalStorage,
      expiredFiles: jobStats.expiredFiles,
      activeUsers: jobStats.activeUsers,
      systemHealth,
      generatedAt: new Date().toISOString()
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
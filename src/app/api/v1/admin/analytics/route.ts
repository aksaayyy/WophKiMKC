/**
 * Admin Analytics API
 * Provides system analytics and metrics for admin dashboard
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
    const period = searchParams.get('period') || '7d' // 24h, 7d, 30d, 90d

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case '24h':
        startDate.setHours(now.getHours() - 24)
        break
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      default:
        startDate.setDate(now.getDate() - 7)
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
      failedJobs: 0,
      processingJobs: 0,
      totalStorageBytes: 0
    }

    try {
      const [
        totalJobsResult,
        completedJobsResult,
        failedJobsResult,
        processingJobsResult,
        storageUsageResult
      ] = await Promise.all([
        supabaseAdmin.from('video_jobs').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('video_jobs').select('id', { count: 'exact', head: true }).eq('status', 'completed').gte('created_at', startDate.toISOString()),
        supabaseAdmin.from('video_jobs').select('id', { count: 'exact', head: true }).eq('status', 'failed').gte('created_at', startDate.toISOString()),
        supabaseAdmin.from('video_jobs').select('id', { count: 'exact', head: true }).eq('status', 'processing'),
        supabaseAdmin.from('video_jobs').select('original_filesize').not('original_filesize', 'is', null)
      ])

      jobStats = {
        totalJobs: totalJobsResult.count || 0,
        completedJobs: completedJobsResult.count || 0,
        failedJobs: failedJobsResult.count || 0,
        processingJobs: processingJobsResult.count || 0,
        totalStorageBytes: storageUsageResult.data?.reduce((sum: number, job: any) => sum + (job.original_filesize || 0), 0) || 0
      }
    } catch (err) {
      console.warn('Video jobs table may not exist:', err)
    }

    // Calculate success rate
    const totalPeriodJobs = jobStats.completedJobs + jobStats.failedJobs
    const successRate = totalPeriodJobs > 0 
      ? ((jobStats.completedJobs / totalPeriodJobs) * 100).toFixed(1)
      : '0'

    const analytics = {
      overview: {
        totalUsers,
        activeUsers: Math.floor(totalUsers * 0.3), // Estimate 30% active users
        totalJobs: jobStats.totalJobs,
        processingJobs: jobStats.processingJobs,
        completedJobs: jobStats.completedJobs,
        failedJobs: jobStats.failedJobs,
        successRate: parseFloat(successRate),
        totalStorageGB: (jobStats.totalStorageBytes / (1024 * 1024 * 1024)).toFixed(2)
      },
      charts: {
        statusDistribution: {
          completed: jobStats.completedJobs,
          failed: jobStats.failedJobs,
          processing: jobStats.processingJobs
        },
        dailyJobs: {},
        topUsers: []
      },
      recentActivity: [],
      period,
      generatedAt: new Date().toISOString()
    }

    return NextResponse.json(analytics)

  } catch (error) {
    console.error('Admin analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/../lib/auth-middleware'
import { videoJobManager } from '../../../../../../../lib/video-job-manager'

// POST /api/v1/admin/jobs/maintenance - Admin job maintenance operations
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request)
    
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { profile } = authResult

    // Check if user has admin privileges (you may want to add an admin role check)
    if (profile.subscription_tier !== 'business') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { action, timeout_minutes } = body

    let result: any = {}

    switch (action) {
      case 'reset_stuck_jobs':
        const resetCount = await videoJobManager.resetStuckJobs(timeout_minutes || 30)
        result = {
          action: 'reset_stuck_jobs',
          jobs_reset: resetCount,
          message: `Reset ${resetCount} stuck jobs`
        }
        break

      case 'get_processing_jobs':
        const processingJobs = await videoJobManager.getProcessingJobs(100)
        result = {
          action: 'get_processing_jobs',
          jobs: processingJobs,
          count: processingJobs.length
        }
        break

      case 'get_pending_jobs':
        const pendingJobs = await videoJobManager.getPendingJobs(100)
        result = {
          action: 'get_pending_jobs',
          jobs: pendingJobs,
          count: pendingJobs.length
        }
        break

      case 'get_system_stats':
        const systemStats = await videoJobManager.getJobStats()
        result = {
          action: 'get_system_stats',
          stats: systemStats
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: reset_stuck_jobs, get_processing_jobs, get_pending_jobs, get_system_stats' },
          { status: 400 }
        )
    }

    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('Admin maintenance error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
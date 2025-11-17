import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/../lib/auth-middleware'
import { videoJobManager } from '../../../../../../lib/video-job-manager'
import { VideoJobManager } from '@/../lib/database'

// GET /api/v1/user/jobs - Get user's video jobs
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request)
    
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { profile } = authResult
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')
    const platform = searchParams.get('platform')
    const quality = searchParams.get('quality')
    const enhancement = searchParams.get('enhancement')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    // Build filters object
    const filters: any = {}
    if (status) filters.status = status
    if (platform) filters.platform_target = platform
    if (quality) filters.quality_preset = quality
    if (enhancement) filters.enhancement_level = enhancement
    if (dateFrom) filters.date_from = dateFrom
    if (dateTo) filters.date_to = dateTo

    // Get user's video jobs with enhanced filtering
    const jobs = await videoJobManager.getUserJobsWithFilters(profile.id, limit, offset, filters)

    // Also get team jobs if user is part of a team
    let teamJobs: any[] = []
    if (profile.team_id) {
      teamJobs = await videoJobManager.getTeamJobsWithFilters(profile.team_id, limit, offset, filters)
      // Filter out user's own jobs to avoid duplicates
      teamJobs = teamJobs.filter(job => job.user_id !== profile.id)
    }

    return NextResponse.json(
      {
        user_jobs: jobs,
        team_jobs: teamJobs,
        total_jobs: jobs.length + teamJobs.length
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Get user jobs error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/../lib/auth-middleware'
import { videoJobManager } from '../../../../../../../lib/video-job-manager'

// GET /api/v1/user/jobs/stats - Get user's job statistics
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

    // Get user job statistics
    const userStats = await videoJobManager.getJobStats(profile.id)
    
    // Get team statistics if user is part of a team
    let teamStats = null
    if (profile.team_id) {
      teamStats = await videoJobManager.getJobStats(undefined, profile.team_id)
    }

    return NextResponse.json(
      {
        user_stats: userStats,
        team_stats: teamStats
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Get job stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
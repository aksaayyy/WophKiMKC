import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/../lib/auth-middleware'
import { videoJobManager } from '../../../../../../lib/video-job-manager'

// GET /api/v1/jobs/[jobId] - Get specific job details
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const authResult = await authenticateUser(request)
    
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { profile } = authResult
    const { jobId } = params

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Get job details
    const job = await videoJobManager.getJobById(jobId)

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this job
    const hasAccess = job.user_id === profile.id || 
                     (profile.team_id && job.team_id === profile.team_id)

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json(job, { status: 200 })

  } catch (error) {
    console.error('Get job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/v1/jobs/[jobId] - Update job status and metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const authResult = await authenticateUser(request)
    
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { profile } = authResult
    const { jobId } = params

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { status, output_files, processing_time, error_message } = body

    // Get existing job to check permissions
    const existingJob = await videoJobManager.getJobById(jobId)

    if (!existingJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this job
    const hasAccess = existingJob.user_id === profile.id || 
                     (profile.team_id && existingJob.team_id === profile.team_id)

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Update job based on the action
    let updatedJob
    
    if (status === 'processing') {
      updatedJob = await videoJobManager.startProcessing(jobId)
    } else if (status === 'completed' && output_files) {
      updatedJob = await videoJobManager.completeJob(jobId, output_files, processing_time)
    } else if (status === 'failed' && error_message) {
      updatedJob = await videoJobManager.failJob(jobId, error_message)
    } else if (status) {
      // Generic status update
      updatedJob = await videoJobManager.updateJobStatus(jobId, status, {
        output_files,
        processing_time,
        error_message
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid update parameters' },
        { status: 400 }
      )
    }

    if (!updatedJob) {
      return NextResponse.json(
        { error: 'Failed to update job' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedJob, { status: 200 })

  } catch (error) {
    console.error('Update job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/jobs/[jobId] - Delete a job
export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const authResult = await authenticateUser(request)
    
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { profile } = authResult
    const { jobId } = params

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Get existing job to check permissions
    const existingJob = await videoJobManager.getJobById(jobId)

    if (!existingJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this job
    const hasAccess = existingJob.user_id === profile.id || 
                     (profile.team_id && existingJob.team_id === profile.team_id)

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Delete the job
    await videoJobManager.deleteJob(jobId)

    return NextResponse.json(
      { message: 'Job deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Delete job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
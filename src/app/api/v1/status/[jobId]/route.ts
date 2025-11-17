import { NextRequest, NextResponse } from 'next/server'
import { VideoJobManager } from '../../../../../../lib/database'
import { videoJobManager } from '../../../../../../lib/video-job-manager'

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }
    
    // Get job status from database
    const videoJob = await videoJobManager.getJobById(jobId)
    
    if (!videoJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }
    
    // Cast to any to access additional fields that may not be in the TypeScript interface
    const job: any = videoJob;
    
    // Calculate file expiry information
    const filesExpired = job.files_expired || false
    let expiryInfo = null
    
    if (job.completed_at && job.status === 'completed') {
      const completedTime = new Date(job.completed_at).getTime()
      const expiryTime = completedTime + (48 * 60 * 60 * 1000) // 48 hours
      const now = Date.now()
      const timeRemaining = expiryTime - now
      
      if (timeRemaining > 0 && !filesExpired) {
        const hoursRemaining = Math.floor(timeRemaining / (60 * 60 * 1000))
        const minutesRemaining = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000))
        
        expiryInfo = {
          expired: false,
          expiresAt: new Date(expiryTime).toISOString(),
          hoursRemaining,
          minutesRemaining,
          message: `Files available for ${hoursRemaining}h ${minutesRemaining}m`
        }
      } else {
        expiryInfo = {
          expired: true,
          expiredAt: job.files_expired_at || new Date(expiryTime).toISOString(),
          message: 'Files expired - only metadata available'
        }
      }
    }

    // Return job status with all necessary fields
    return NextResponse.json({
      id: job.id,
      status: job.status,
      original_filename: job.original_filename,
      original_filesize: job.original_filesize,
      clip_count: job.clip_count,
      quality_preset: job.quality_preset,
      enhancement_level: job.enhancement_level,
      platform_target: job.platform_target,
      output_files: job.output_files,
      processing_time: job.processing_time,
      error_message: job.error_message,
      created_at: job.created_at,
      started_at: job.started_at,
      completed_at: job.completed_at,
      progress: job.progress || 0,
      clips_generated: job.clips_generated || 0,
      files_expired: filesExpired,
      files_expired_at: job.files_expired_at,
      expiry: expiryInfo,
      clips: job.clips_data ? job.clips_data.map((clip: any) => ({
        id: clip.filename,
        url: clip.publicUrl,
        duration: clip.duration,
        size: clip.size
      })) : []
    })
    
  } catch (error) {
    console.error('[Status API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
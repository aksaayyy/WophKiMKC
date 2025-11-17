/**
 * Real-time Progress API for CLI Integration
 * Provides Server-Sent Events for real-time progress updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../../../lib/supabase'
import { videoJobManager } from '../../../../../../lib/video-job-manager'
import { authenticateUser } from '../../../../../../lib/auth-middleware'
import { progressMonitor } from '../../../../../lib/cli/ProgressMonitor'

// In a real implementation, you would store actual progress data
// For now, we'll simulate progress based on job status
const jobProgress = new Map<string, number>()

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
    
    // Simulate progress based on status
    let progress = 0
    let message = 'Initializing...'
    
    switch (videoJob.status) {
      case 'queued':
        progress = 0
        message = 'Waiting in queue...'
        break
      case 'processing':
        // Simulate progress for processing jobs
        progress = jobProgress.get(jobId) || Math.floor(Math.random() * 50) + 10
        message = 'Processing video...'
        break
      case 'completed':
        progress = 100
        message = 'Processing completed successfully!'
        break
      case 'failed':
        progress = 0
        message = videoJob.error_message || 'Processing failed'
        break
    }
    
    // Update progress map for simulation
    if (videoJob.status === 'processing') {
      // Increment progress for simulation
      const currentProgress = jobProgress.get(jobId) || 20
      const newProgress = Math.min(95, currentProgress + Math.floor(Math.random() * 10))
      jobProgress.set(jobId, newProgress)
    } else if (videoJob.status === 'completed' || videoJob.status === 'failed') {
      // Clear progress when job is done
      jobProgress.delete(jobId)
    }
    
    return NextResponse.json({
      jobId: videoJob.id,
      status: videoJob.status,
      progress,
      message,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[Progress API] Error:', error)
    return NextResponse.json(
      { 
        jobId: params.jobId,
        status: 'error',
        progress: 0,
        message: 'Failed to get progress',
        timestamp: new Date().toISOString()
      },
      { status: 200 } // Still return 200 so frontend keeps polling
    )
  }
}

/**
 * POST /api/v1/progress/[jobId]/subscribe - Subscribe to real-time progress updates
 */
export async function POST(
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

    const { auth: user, profile } = authResult
    const { jobId } = params

    // Verify job ownership
    const job = await videoJobManager.getJobById(jobId)
    if (!job || job.user_id !== profile.id) {
      return NextResponse.json(
        { error: 'Job not found or access denied' },
        { status: 404 }
      )
    }

    // Check if job is still active
    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Job is no longer active' },
        { status: 400 }
      )
    }

    // Create Server-Sent Events response
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const initialMessage = `data: ${JSON.stringify({
          type: 'connected',
          job_id: jobId,
          timestamp: new Date().toISOString()
        })}\n\n`
        controller.enqueue(encoder.encode(initialMessage))

        // Subscribe to progress updates
        const unsubscribe = progressMonitor.subscribe(jobId, profile.id, (progress) => {
          const message = `data: ${JSON.stringify({
            type: 'progress',
            ...progress,
            timestamp: progress.timestamp.toISOString()
          })}\n\n`
          
          try {
            controller.enqueue(encoder.encode(message))
          } catch (error) {
            console.error('Error sending progress update:', error)
            unsubscribe()
            controller.close()
          }
        })

        // Send heartbeat every 30 seconds
        const heartbeatInterval = setInterval(() => {
          const heartbeat = `data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          })}\n\n`
          
          try {
            controller.enqueue(encoder.encode(heartbeat))
          } catch (error) {
            clearInterval(heartbeatInterval)
            unsubscribe()
            controller.close()
          }
        }, 30000)

        // Cleanup on close
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeatInterval)
          unsubscribe()
          controller.close()
        })

        // Auto-cleanup after 10 minutes
        setTimeout(() => {
          clearInterval(heartbeatInterval)
          unsubscribe()
          controller.close()
        }, 10 * 60 * 1000)
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    })

  } catch (error) {
    console.error('Progress Subscribe API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
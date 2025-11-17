import { NextRequest, NextResponse } from 'next/server'
import { VideoJobManager } from '../../../../../../lib/database'
import { videoJobManager } from '../../../../../../lib/video-job-manager'

export async function POST(
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
    
    // In a real implementation, you would verify the webhook signature
    // For now, we'll just update the job status based on the payload
    
    const payload = await request.json()
    
    // Update job based on webhook payload
    if (payload.status) {
      await videoJobManager.updateJobStatus(jobId, payload.status)
    }
    
    // Log webhook receipt
    console.log(`[Webhook] Received for job ${jobId}:`, payload)
    
    return NextResponse.json({ received: true })
    
  } catch (error) {
    console.error('[Webhook API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
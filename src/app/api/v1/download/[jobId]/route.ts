import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

function validateApiKey(apiKey: string): boolean {
  return Boolean(apiKey && apiKey.startsWith('vcp_') && apiKey.length >= 20)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // Get API key from Authorization header
    const headersList = headers()
    const authorization = headersList.get('authorization')
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      )
    }
    
    const apiKey = authorization.replace('Bearer ', '')
    
    // Validate API key
    if (!validateApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }
    
    const { jobId } = params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'zip'
    const clipId = searchParams.get('clip_id')
    
    // In production, check if job is completed and user has access
    // For demo, we'll return download URLs
    
    if (clipId) {
      // Download specific clip
      return NextResponse.json({
        download_url: `https://cdn.videoclipperpro.com/clips/${jobId}_${clipId}.mp4`,
        expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
        size_mb: 2.5,
        format: 'mp4'
      })
    } else {
      // Download all clips as zip
      return NextResponse.json({
        download_url: `https://cdn.videoclipperpro.com/archives/${jobId}_all_clips.zip`,
        expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
        size_mb: 8.2,
        format: 'zip',
        contents: [
          { filename: `${jobId}_clip_1.mp4`, size_mb: 2.3 },
          { filename: `${jobId}_clip_2.mp4`, size_mb: 2.8 },
          { filename: `${jobId}_clip_3.mp4`, size_mb: 3.1 }
        ]
      })
    }
    
  } catch (error) {
    console.error('Download API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
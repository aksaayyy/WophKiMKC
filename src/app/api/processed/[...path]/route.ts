import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import { join } from 'path'
import { createHash } from 'crypto'
import { supabase } from '../../../../../lib/supabase'

/**
 * Generate secure download token
 */
function generateDownloadToken(filename: string, userId: string, expiresAt: Date): string {
  const data = `${filename}:${userId}:${expiresAt.getTime()}`
  const secret = process.env.JWT_SECRET || 'fallback-secret'
  return createHash('sha256').update(data + secret).digest('hex').substring(0, 32)
}

// Authentication middleware for file access
async function authenticateUser(request: NextRequest) {
  const authorization = request.headers.get('authorization')
  
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header', status: 401 }
  }

  const token = authorization.replace('Bearer ', '')
  
  // Check if it's a service role key (for admin access)
  if (token === process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { user: { id: 'service-role' }, isServiceRole: true }
  }
  
  // Try to get user with the token
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return { error: 'Invalid session', status: 401 }
  }

  return { user }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Get authentication parameters
    const { searchParams } = new URL(request.url)
    const tokenFromQuery = searchParams.get('token')
    const expiresParam = searchParams.get('expires')
    
    let authResult
    let userId: string
    
    if (tokenFromQuery && expiresParam) {
      // Validate secure download token
      const filename = params.path[params.path.length - 1]
      const expiresAt = parseInt(expiresParam)
      
      // Check if token has expired
      if (Date.now() > expiresAt) {
        return NextResponse.json(
          { error: 'Download link has expired' },
          { status: 401 }
        )
      }
      
      // Extract user ID from path (first segment should be user ID)
      userId = params.path[0]
      
      // Validate token
      const expectedToken = generateDownloadToken(filename, userId, new Date(expiresAt))
      if (tokenFromQuery !== expectedToken) {
        return NextResponse.json(
          { error: 'Invalid download token' },
          { status: 401 }
        )
      }
      
      authResult = { user: { id: userId } }
    } else {
      // Use header authentication
      authResult = await authenticateUser(request)
      if ('error' in authResult) {
        return NextResponse.json(
          { error: authResult.error },
          { status: authResult.status }
        )
      }
      userId = authResult.user.id
    }

    const filePath = params.path.join('/')
    
    // Validate path structure: userId/jobId/filename
    if (params.path.length < 3) {
      return NextResponse.json(
        { error: 'Invalid file path structure' },
        { status: 400 }
      )
    }
    
    const pathUserId = params.path[0]
    const jobId = params.path[1]
    const filename = params.path[params.path.length - 1]
    
    // Skip user validation for service role
    const isServiceRole = authResult && 'isServiceRole' in authResult && authResult.isServiceRole
    
    if (!isServiceRole) {
      // Verify user ID matches
      if (pathUserId !== userId) {
        return NextResponse.json(
          { error: 'Access denied - user mismatch' },
          { status: 403 }
        )
      }

      // Verify user owns this job (only if not using secure token)
      if (!tokenFromQuery) {
        const { data: job, error: jobError } = await supabase
          .from('video_jobs')
          .select('user_id')
          .eq('id', jobId)
          .single()

        if (jobError || !job || job.user_id !== userId) {
          return NextResponse.json(
            { error: 'Access denied - job ownership' },
            { status: 403 }
          )
        }
      }
    }

    const fullPath = join(process.cwd(), 'public', 'processed', filePath)
    
    try {
      // Check if file exists
      await stat(fullPath)
      
      const fileBuffer = await readFile(fullPath)
      
      // Determine content type based on file extension
      const extension = filePath.split('.').pop()?.toLowerCase()
      let contentType = 'application/octet-stream'
      
      switch (extension) {
        case 'mp4':
          contentType = 'video/mp4'
          break
        case 'mov':
          contentType = 'video/quicktime'
          break
        case 'avi':
          contentType = 'video/x-msvideo'
          break
        case 'mkv':
          contentType = 'video/x-matroska'
          break
        case 'webm':
          contentType = 'video/webm'
          break
      }

      // Create response with proper headers
      const response = new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': tokenFromQuery ? 'private, max-age=3600' : 'private, no-cache',
          'Content-Length': fileBuffer.length.toString(),
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY'
        },
      })
      
      return response
    } catch (error) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('File serving error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { supabase } from '../../../../../lib/supabase'
import { videoJobManager } from '../../../../../lib/video-job-manager'
import { UsageTracker } from '../../../../../lib/database'
import { processingBridge } from '../../../../lib/cli/ProcessingBridge'
import { ConfigurationMapper, WebProcessingConfig } from '../../../../lib/cli/ConfigurationMapper'
import { progressMonitor } from '../../../../lib/cli/ProgressMonitor'

// Authentication middleware
async function authenticateUser(request: NextRequest) {
  const authorization = request.headers.get('authorization')
  
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header', status: 401 }
  }

  const token = authorization.replace('Bearer ', '')
  
  // Check if it's a service role key (for admin access)
  if (token === process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { user: { id: '00000000-0000-0000-0000-000000000000' }, isServiceRole: true }
  }

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return { error: 'Invalid session', status: 401 }
  }

  return { user }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request)
    
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { user } = authResult
    const userId = user.id
    const subscriptionTier: 'free' | 'pro' | 'business' = 'free' // Default for now
    
    // For now, skip rate limiting - can be added later
    const rateLimitCheck = { allowed: true, remaining: 100, resetTime: Date.now() + 3600000 }
    
    // Check usage limits for authenticated users
    if (!('error' in authResult)) {
      const usageCheck = await UsageTracker.checkUsageLimits(userId, subscriptionTier)
      if (!usageCheck.canProcess) {
        return NextResponse.json(
          { error: 'Monthly usage limits exceeded. Please upgrade your subscription.' },
          { status: 429 }
        )
      }
    }
    
    // Parse FormData from request
    const formData = await request.formData()
    const file = formData.get('file') as File
    const platform = (formData.get('platform') as string) || 'tiktok'
    const quality = (formData.get('quality') as string) || 'high'
    const clipCount = parseInt((formData.get('clipCount') as string) || '3')
    const enhanceAudio = (formData.get('enhanceAudio') as string) === 'true'
    const colorCorrection = (formData.get('colorCorrection') as string) === 'true'
    const smartSelection = (formData.get('smartSelection') as string) === 'true'
    const minClipLength = parseInt((formData.get('minClipLength') as string) || '15')
    const maxClipLength = parseInt((formData.get('maxClipLength') as string) || '60')
    
    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      )
    }
    
    // Validate platform
    const validPlatforms = ['tiktok', 'instagram', 'youtube', 'twitter']
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be one of: ' + validPlatforms.join(', ') },
        { status: 400 }
      )
    }
    
    // Validate quality
    const validQualities = ['standard', 'high', 'premium']
    if (!validQualities.includes(quality)) {
      return NextResponse.json(
        { error: 'Invalid quality. Must be one of: ' + validQualities.join(', ') },
        { status: 400 }
      )
    }
    
    // Validate clip count
    if (clipCount < 1 || clipCount > 10) {
      return NextResponse.json(
        { error: 'clipCount must be between 1 and 10' },
        { status: 400 }
      )
    }
    
    // Validate clip length parameters
    if (minClipLength < 5 || minClipLength > 30) {
      return NextResponse.json(
        { error: 'minClipLength must be between 5 and 30 seconds' },
        { status: 400 }
      )
    }
    
    if (maxClipLength < 30 || maxClipLength > 120) {
      return NextResponse.json(
        { error: 'maxClipLength must be between 30 and 120 seconds' },
        { status: 400 }
      )
    }
    
    if (minClipLength >= maxClipLength) {
      return NextResponse.json(
        { error: 'minClipLength must be less than maxClipLength' },
        { status: 400 }
      )
    }
    
    // Save uploaded file to temporary location
    const filename = file.name
    const tempDir = path.join(process.cwd(), 'temp')
    const tempFilePath = path.join(tempDir, `${Date.now()}_${filename}`)
    
    // Ensure temp directory exists
    await fs.mkdir(tempDir, { recursive: true })
    
    // Save file to disk
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(tempFilePath, buffer)

    // Create web processing configuration
    const webConfig: WebProcessingConfig = {
      inputFile: tempFilePath, // Pass the file path
      platform: platform as WebProcessingConfig['platform'],
      quality: quality as WebProcessingConfig['quality'],
      clipCount: clipCount,
      enhanceAudio: enhanceAudio,
      colorCorrection: colorCorrection,
      smartSelection: smartSelection,
      // Clip length customization
      advancedOptions: {
        minDuration: minClipLength,
        maxDuration: maxClipLength
      }
    }
    
    // Validate configuration
    const validation = ConfigurationMapper.validateWebConfig(webConfig)
    if (!validation.valid) {
      return NextResponse.json(
        { error: `Invalid configuration: ${validation.errors.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Get processing suggestions and summary
    const suggestions = processingBridge.getProcessingSuggestions(webConfig)
    
    // Create video job record in database with enhanced metadata
    const videoJob = await videoJobManager.createJob({
      user_id: userId,
      team_id: undefined, // Can be added later for team features
      original_filename: filename,
      original_filesize: file.size,
      status: 'queued',
      clip_count: clipCount,
      quality_preset: ConfigurationMapper.mapQualityWithPlatform(quality as any, platform) as any,
      enhancement_level: enhanceAudio || colorCorrection || smartSelection ? 'pro' : 'none',
      platform_target: platform as any
    })
    
    if (!videoJob) {
      return NextResponse.json(
        { error: 'Failed to create video job' },
        { status: 500 }
      )
    }
    
    // Start CLI-based video processing in background
    processingBridge.startProcessing({
      userId,
      jobId: videoJob.id,
      webConfig,
      notifyProgress: true
    }).catch(error => {
      console.error(`[Process API] Background processing failed for job ${videoJob.id}:`, error)
      // Error handling is done within the processing bridge
    })
    
    return NextResponse.json(
      {
        jobId: videoJob.id,
        status: 'queued',
        estimated_time: suggestions.estimatedTime,
        message: 'Video processing started with advanced CLI features',
        features_enabled: webConfig.smartSelection || webConfig.enhanceAudio || webConfig.colorCorrection ? 
          ['CLI Integration', ...(webConfig.smartSelection ? ['Smart Selection'] : []), 
           ...(webConfig.enhanceAudio ? ['Audio Enhancement'] : []),
           ...(webConfig.colorCorrection ? ['Color Correction'] : [])] : ['CLI Integration'],
        processing_summary: suggestions.summary,
        warnings: suggestions.warnings,
        webhook_url: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/webhook/${videoJob.id}`,
        status_url: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/status/${videoJob.id}`,
        progress_url: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/progress/${videoJob.id}`
      },
      {
        status: 202,
        headers: {
          'X-RateLimit-Remaining': String(rateLimitCheck.remaining),
          'X-RateLimit-Reset': String(Math.ceil(rateLimitCheck.resetTime / 1000))
        }
      }
    )
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '../../../../../../lib/auth-middleware'
import { videoJobManager } from '../../../../../../lib/video-job-manager'
import { VideoJobManager, UsageTracker } from '../../../../../../lib/database'
import { processingBridge } from '../../../../../lib/cli/ProcessingBridge'
import { ConfigurationMapper, WebProcessingConfig } from '../../../../../lib/cli/ConfigurationMapper'

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
    const userId = profile.id
    
    // Parse request body
    const body = await request.json()
    const { 
      youtube_url,
      platform = 'tiktok', 
      quality = 'high', 
      clipCount = 3,
      enhanceAudio = false,
      colorCorrection = false,
      smartSelection = true,
      minClipLength = 15,
      maxClipLength = 60
    } = body
    
    // Validate required fields
    if (!youtube_url) {
      return NextResponse.json(
        { error: 'youtube_url is required' },
        { status: 400 }
      )
    }
    
    // Validate YouTube URL
    const youtubePatterns = [
      /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/,
      /^https?:\/\/(www\.)?youtube\.com\/shorts\//,
      /^https?:\/\/(www\.)?youtube\.com\/live\//
    ]
    
    const isValidYouTubeUrl = youtubePatterns.some(pattern => pattern.test(youtube_url))
    if (!isValidYouTubeUrl) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL format' },
        { status: 400 }
      )
    }
    
    // Validate platform
    const validPlatforms = ['tiktok', 'instagram', 'youtube_shorts']
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
    
    // Check usage limits
    const usageCheck = await UsageTracker.checkUsageLimits(userId, profile.subscription_tier)
    if (!usageCheck.canProcess) {
      return NextResponse.json(
        { 
          error: 'Monthly usage limits exceeded. Please upgrade your subscription.',
          upgrade_url: '/pricing'
        },
        { status: 429 }
      )
    }
    
    // Extract video ID from YouTube URL for filename
    let videoId = ''
    try {
      const url = new URL(youtube_url)
      if (url.hostname.includes('youtu.be')) {
        videoId = url.pathname.slice(1)
      } else if (url.searchParams.has('v')) {
        videoId = url.searchParams.get('v') || ''
      } else if (url.pathname.includes('/shorts/')) {
        videoId = url.pathname.split('/shorts/')[1]
      }
    } catch (error) {
      videoId = 'youtube_video'
    }
    
    const filename = `youtube_${videoId}_${Date.now()}.mp4`

    // Create web processing configuration for YouTube
    const webConfig: WebProcessingConfig = {
      inputFile: youtube_url,
      platform: platform as WebProcessingConfig['platform'],
      quality: quality as WebProcessingConfig['quality'],
      clipCount: clipCount,
      enhanceAudio: enhanceAudio,
      colorCorrection: colorCorrection,
      smartSelection: smartSelection,
      // YouTube-specific options
      youtubeMode: true,
      chunkDownload: true,
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
    
    // Create video job record in database
    const videoJob = await videoJobManager.createJob({
      user_id: userId,
      team_id: profile.team_id,
      original_filename: filename,
      original_filesize: 0, // Will be updated after YouTube download
      status: 'queued',
      clip_count: clipCount,
      quality_preset: ConfigurationMapper.mapQualityWithPlatform(quality as any, platform) as any,
      enhancement_level: enhanceAudio || colorCorrection || smartSelection ? 'pro' : 'basic',
      platform_target: platform as any
    })
    
    if (!videoJob) {
      return NextResponse.json(
        { error: 'Failed to create video job' },
        { status: 500 }
      )
    }
    
    // Start YouTube processing in background
    processingBridge.startProcessing({
      userId,
      jobId: videoJob.id,
      webConfig,
      notifyProgress: true
    }).catch(error => {
      console.error(`[YouTube API] Background processing failed for job ${videoJob.id}:`, error)
    })
    
    return NextResponse.json(
      {
        job_id: videoJob.id,
        status: 'queued',
        estimated_time: suggestions.estimatedTime,
        message: 'YouTube video processing started with smart chunked download',
        youtube_features: [
          'Smart Chunked Download',
          'Optimized Processing',
          ...(smartSelection ? ['AI Smart Selection'] : []),
          ...(enhanceAudio ? ['Audio Enhancement'] : []),
          ...(colorCorrection ? ['Color Correction'] : [])
        ],
        processing_summary: {
          message: suggestions.summary,
          youtube_mode: true,
          chunk_download: true,
          min_clip_length: minClipLength,
          max_clip_length: maxClipLength
        },
        warnings: suggestions.warnings,
        status_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/status/${videoJob.id}`,
        progress_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/progress/${videoJob.id}`
      },
      {
        status: 202,
        headers: {
          'X-Processing-Mode': 'youtube',
          'X-Chunk-Download': 'enabled'
        }
      }
    )
    
  } catch (error) {
    console.error('YouTube API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
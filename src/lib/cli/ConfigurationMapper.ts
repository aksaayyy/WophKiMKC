/**
 * Configuration Mapper
 * Maps web interface options to CLI tool parameters
 */

import { CLIParameters } from './CLIProcessManager'

export interface WebProcessingConfig {
  inputFile: string
  platform: 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'youtube_shorts'
  quality: 'standard' | 'high' | 'premium'
  clipCount: number
  enhanceAudio?: boolean
  colorCorrection?: boolean
  smartSelection?: boolean
  // YouTube-specific options
  youtubeMode?: boolean
  chunkDownload?: boolean
  collaborationSettings?: {
    projectId?: string
    memberId?: string
    templateName?: string
  }
  advancedOptions?: {
    minDuration?: number
    maxDuration?: number
    selectionStrategy?: string
    logoPath?: string
    musicPack?: string
  }
}

export interface PlatformOptimization {
  aspectRatio: string
  maxDuration: number
  recommendedBitrate: string
  audioSettings: {
    sampleRate: number
    bitrate: string
  }
  encodingPreset: string
}

export class ConfigurationMapper {
  private static readonly QUALITY_MAPPING = {
    'standard': 'social',      // Web 'standard' → CLI 'social'
    'high': 'pro',            // Web 'high' → CLI 'pro'  
    'premium': 'cinematic'    // Web 'premium' → CLI 'cinematic'
  } as const

  private static readonly PLATFORM_OPTIMIZATIONS: Record<string, PlatformOptimization> = {
    'tiktok': {
      aspectRatio: '9:16',
      maxDuration: 60,
      recommendedBitrate: '5000k',
      audioSettings: {
        sampleRate: 44100,
        bitrate: '128k'
      },
      encodingPreset: 'faster'
    },
    'instagram': {
      aspectRatio: '9:16',
      maxDuration: 90,
      recommendedBitrate: '6000k',
      audioSettings: {
        sampleRate: 44100,
        bitrate: '128k'
      },
      encodingPreset: 'medium'
    },
    'youtube': {
      aspectRatio: '9:16',
      maxDuration: 300,
      recommendedBitrate: '8000k',
      audioSettings: {
        sampleRate: 48000,
        bitrate: '192k'
      },
      encodingPreset: 'slow'
    },
    'twitter': {
      aspectRatio: '9:16',
      maxDuration: 140,
      recommendedBitrate: '4000k',
      audioSettings: {
        sampleRate: 44100,
        bitrate: '128k'
      },
      encodingPreset: 'faster'
    }
  }

  /**
   * Map web configuration to CLI parameters
   */
  static mapWebConfigToCLI(webConfig: WebProcessingConfig, outputDir: string): CLIParameters {
    const cliParams: CLIParameters = {
      input: webConfig.inputFile,
      platform: webConfig.platform,
      quality: this.QUALITY_MAPPING[webConfig.quality],
      clips: webConfig.clipCount,
      outputDir,
      enhanceAudio: webConfig.enhanceAudio || false,
      colorCorrection: webConfig.colorCorrection || false,
      smartSelection: webConfig.smartSelection || false
    }

    // Add collaboration settings if provided
    if (webConfig.collaborationSettings) {
      cliParams.projectId = webConfig.collaborationSettings.projectId
      cliParams.memberId = webConfig.collaborationSettings.memberId
    }

    // Add debug mode for development
    if (process.env.NODE_ENV === 'development') {
      cliParams.debug = true
    }

    console.log('[Config Mapper] Mapped web config to CLI params:', {
      webConfig: this.sanitizeConfigForLogging(webConfig),
      cliParams: this.sanitizeConfigForLogging(cliParams)
    })

    return cliParams
  }

  /**
   * Get platform-specific optimizations
   */
  static getPlatformOptimizations(platform: string): PlatformOptimization {
    return this.PLATFORM_OPTIMIZATIONS[platform] || this.PLATFORM_OPTIMIZATIONS['tiktok']
  }

  /**
   * Map quality level to CLI quality preset with platform considerations
   */
  static mapQualityWithPlatform(quality: WebProcessingConfig['quality'], platform: string): string {
    const baseQuality = this.QUALITY_MAPPING[quality]
    const platformOpt = this.getPlatformOptimizations(platform)
    
    // For platforms that prioritize speed (TikTok, Twitter), use faster presets for standard quality
    if (quality === 'standard' && (platform === 'tiktok' || platform === 'twitter')) {
      return 'social'
    }
    
    // For YouTube, which allows longer content, use higher quality defaults
    if (platform === 'youtube' && quality === 'high') {
      return 'pro'
    }
    
    return baseQuality
  }

  /**
   * Generate CLI arguments for advanced features
   */
  static generateAdvancedFeatureArgs(webConfig: WebProcessingConfig): string[] {
    const args: string[] = []
    
    if (webConfig.smartSelection) {
      args.push('--smart-selection')
      
      // Add selection strategy if specified
      const strategy = webConfig.advancedOptions?.selectionStrategy || 'hybrid'
      args.push('--selection-strategy', strategy)
    }
    
    if (webConfig.enhanceAudio) {
      args.push('--enhance-audio')
      // Note: Audio settings are handled internally by the CLI script
      // based on platform optimization
    }
    
    if (webConfig.colorCorrection) {
      args.push('--color-correction')
    }
    
    // Add duration constraints if specified
    if (webConfig.advancedOptions?.minDuration) {
      args.push('--min-duration', webConfig.advancedOptions.minDuration.toString())
    }
    
    if (webConfig.advancedOptions?.maxDuration) {
      args.push('--max-duration', webConfig.advancedOptions.maxDuration.toString())
    }
    
    // Add logo/watermark if specified
    if (webConfig.advancedOptions?.logoPath) {
      args.push('--logo', webConfig.advancedOptions.logoPath)
    }
    
    // Add music pack if specified
    if (webConfig.advancedOptions?.musicPack) {
      args.push('--music-pack', webConfig.advancedOptions.musicPack)
    }
    
    return args
  }

  /**
   * Validate web configuration before mapping
   */
  static validateWebConfig(webConfig: WebProcessingConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Validate required fields
    if (!webConfig.inputFile) {
      errors.push('Input file is required')
    }
    
    if (!webConfig.platform) {
      errors.push('Platform selection is required')
    }
    
    if (!webConfig.quality) {
      errors.push('Quality selection is required')
    }
    
    if (!webConfig.clipCount || webConfig.clipCount < 1 || webConfig.clipCount > 20) {
      errors.push('Clip count must be between 1 and 20')
    }
    
    // Validate platform-specific constraints - REMOVED: This was incorrectly limiting user's clip duration choices
    // The platform maxDuration is a recommendation, not a hard limit for clip generation
    // Users should be able to set custom clip durations regardless of platform recommendations
    
    // Validate file path
    if (webConfig.inputFile && !this.isValidFilePath(webConfig.inputFile)) {
      errors.push('Invalid input file path')
    }
    
    // Validate that minDuration is not greater than maxDuration
    if (webConfig.advancedOptions?.minDuration && webConfig.advancedOptions?.maxDuration) {
      if (webConfig.advancedOptions.minDuration > webConfig.advancedOptions.maxDuration) {
        errors.push('Minimum duration cannot be greater than maximum duration')
      }
    }
    
    // Validate reasonable duration limits
    if (webConfig.advancedOptions?.maxDuration && webConfig.advancedOptions.maxDuration > 1200) { // 20 minutes
      errors.push('Maximum duration cannot exceed 20 minutes')
    }
    
    if (webConfig.advancedOptions?.minDuration && webConfig.advancedOptions.minDuration < 1) {
      errors.push('Minimum duration must be at least 1 second')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Get recommended settings for a platform
   */
  static getRecommendedSettings(platform: string): Partial<WebProcessingConfig> {
    const platformOpt = this.getPlatformOptimizations(platform)
    
    const recommendations: Partial<WebProcessingConfig> = {
      platform: platform as WebProcessingConfig['platform'],
      quality: 'high', // Default to high quality
      clipCount: 5,    // Default clip count
      enhanceAudio: true, // Recommended for all platforms
      smartSelection: true, // Use AI selection
      advancedOptions: {
        maxDuration: Math.min(platformOpt.maxDuration, 45), // Conservative duration
        selectionStrategy: 'hybrid'
      }
    }
    
    // Platform-specific recommendations
    switch (platform) {
      case 'tiktok':
        recommendations.quality = 'standard' // Faster processing for TikTok
        recommendations.clipCount = 8 // More clips for TikTok
        break
        
      case 'youtube':
        recommendations.quality = 'premium' // Higher quality for YouTube
        recommendations.clipCount = 3 // Fewer, longer clips
        recommendations.colorCorrection = true
        break
        
      case 'instagram':
        recommendations.quality = 'high'
        recommendations.clipCount = 5
        recommendations.colorCorrection = true
        break
        
      case 'twitter':
        recommendations.quality = 'standard'
        recommendations.clipCount = 6
        break
    }
    
    return recommendations
  }

  /**
   * Create processing summary for user display
   */
  static createProcessingSummary(webConfig: WebProcessingConfig): {
    platform: string
    quality: string
    features: string[]
    estimatedTime: string
    outputSpecs: {
      aspectRatio: string
      maxDuration: number
      quality: string
    }
  } {
    const platformOpt = this.getPlatformOptimizations(webConfig.platform)
    const features: string[] = []
    
    if (webConfig.smartSelection) features.push('AI Smart Selection')
    if (webConfig.enhanceAudio) features.push('Audio Enhancement')
    if (webConfig.colorCorrection) features.push('Color Correction')
    if (webConfig.collaborationSettings?.projectId) features.push('Team Collaboration')
    
    // Estimate processing time based on features and quality
    let baseTime = webConfig.clipCount * 30 // 30 seconds per clip base
    if (webConfig.quality === 'premium') baseTime *= 2
    if (webConfig.smartSelection) baseTime *= 1.5
    if (webConfig.enhanceAudio) baseTime *= 1.3
    if (webConfig.colorCorrection) baseTime *= 1.2
    
    const estimatedMinutes = Math.ceil(baseTime / 60)
    const estimatedTime = estimatedMinutes < 60 
      ? `${estimatedMinutes} minutes`
      : `${Math.ceil(estimatedMinutes / 60)} hours`
    
    return {
      platform: webConfig.platform.toUpperCase(),
      quality: this.QUALITY_MAPPING[webConfig.quality].toUpperCase(),
      features,
      estimatedTime,
      outputSpecs: {
        aspectRatio: platformOpt.aspectRatio,
        maxDuration: platformOpt.maxDuration,
        quality: platformOpt.recommendedBitrate
      }
    }
  }

  /**
   * Helper method to validate file paths
   */
  private static isValidFilePath(filePath: string): boolean {
    // Basic validation - in production, add more comprehensive checks
    return filePath.length > 0 && 
           !filePath.includes('..') && 
           !filePath.includes('<') && 
           !filePath.includes('>')
  }

  /**
   * Sanitize configuration for logging (remove sensitive data)
   */
  private static sanitizeConfigForLogging(config: any): any {
    const sanitized = { ...config }
    
    // Remove or mask sensitive fields
    if (sanitized.inputFile) {
      sanitized.inputFile = sanitized.inputFile.replace(/\/[^\/]+$/, '/***')
    }
    
    if (sanitized.collaborationSettings?.memberId) {
      sanitized.collaborationSettings.memberId = '***'
    }
    
    return sanitized
  }
}

export default ConfigurationMapper
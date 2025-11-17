import path from 'path'

// Type definitions
export interface WebProcessingConfig {
  inputFile: string
  platform: 'tiktok' | 'instagram' | 'youtube' | 'twitter'
  quality: 'standard' | 'high' | 'premium'
  clipCount: number
  enhanceAudio: boolean
  colorCorrection: boolean
  smartSelection: boolean
  youtubeMode?: boolean
  chunkDownload?: boolean
  advancedOptions?: {
    minDuration?: number
    maxDuration?: number
  }
}

interface ValidationResponse {
  valid: boolean
  errors: string[]
}

interface QualityMapping {
  standard: string
  high: string
  premium: string
}

export class ConfigurationMapper {
  private static qualityMappings: Record<string, QualityMapping> = {
    tiktok: {
      standard: 'social',
      high: 'pro',
      premium: 'cinematic'
    },
    instagram: {
      standard: 'social',
      high: 'pro',
      premium: 'cinematic'
    },
    youtube: {
      standard: 'social',
      high: 'pro',
      premium: 'master'
    },
    twitter: {
      standard: 'social',
      high: 'pro',
      premium: 'cinematic'
    }
  }

  /**
   * Validate web configuration
   */
  static validateWebConfig(config: WebProcessingConfig): ValidationResponse {
    const errors: string[] = []

    // Validate required fields
    if (!config.inputFile) {
      errors.push('Input file is required')
    }

    // Validate platform
    const validPlatforms = ['tiktok', 'instagram', 'youtube', 'twitter']
    if (!validPlatforms.includes(config.platform)) {
      errors.push(`Invalid platform. Must be one of: ${validPlatforms.join(', ')}`)
    }

    // Validate quality
    const validQualities = ['standard', 'high', 'premium']
    if (!validQualities.includes(config.quality)) {
      errors.push(`Invalid quality. Must be one of: ${validQualities.join(', ')}`)
    }

    // Validate clip count
    if (config.clipCount < 1 || config.clipCount > 20) {
      errors.push('Clip count must be between 1 and 20')
    }

    // Validate file extension
    const validExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm']
    const fileExt = path.extname(config.inputFile).toLowerCase()
    if (!validExtensions.includes(fileExt)) {
      errors.push(`Invalid file format. Must be one of: ${validExtensions.join(', ')}`)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Map quality with platform-specific settings
   */
  static mapQualityWithPlatform(quality: string, platform: string): string {
    const platformMapping = this.qualityMappings[platform]
    if (!platformMapping) {
      return 'social' // default fallback
    }
    
    return platformMapping[quality as keyof QualityMapping] || 'social'
  }

  /**
   * Map web configuration to CLI arguments
   */
  static mapToCLIArgs(config: WebProcessingConfig): string[] {
    const args: string[] = [
      '--input', config.inputFile,
      '--clips', config.clipCount.toString(),
      '--quality', this.mapQualityWithPlatform(config.quality, config.platform)
    ]
    
    // Add platform if supported
    if (config.platform) {
      args.push('--platform', config.platform)
    }
    
    // Add enhancement flags
    if (config.enhanceAudio) {
      args.push('--enhance-audio')
    }
    
    if (config.colorCorrection) {
      args.push('--color-correction')
    }
    
    if (config.smartSelection) {
      args.push('--smart-selection')
    }
    
    return args
  }
}
/**
 * CLI File Manager
 * Handles file preparation and management for CLI integration
 */

import fs from 'fs/promises'
import path from 'path'
import { createHash } from 'crypto'
import { spawn } from 'child_process'

export interface FileValidationResult {
  valid: boolean
  errors: string[]
  metadata?: {
    duration: number
    resolution: string
    format: string
    size: number
    bitrate?: number
    frameRate?: number
  }
}

export interface PreparedFile {
  originalPath: string
  preparedPath: string
  filename: string
  size: number
  hash: string
  metadata: FileValidationResult['metadata']
}

export interface ProcessedFiles {
  clips: Array<{
    filename: string
    path: string
    publicUrl: string
    size: number
    duration: number
    platform: string
    quality: string
  }>
  metadata: {
    totalClips: number
    totalSize: number
    processingTime: number
    qualityUsed: string
    cliVersion: string
  }
}

export class CLIFileManager {
  private inputBaseDir: string
  private outputBaseDir: string
  private tempDir: string
  private maxFileSize: number
  private supportedFormats: Set<string>

  constructor(config: {
    inputBaseDir?: string
    outputBaseDir?: string
    tempDir?: string
    maxFileSize?: number
  } = {}) {
    this.inputBaseDir = config.inputBaseDir || path.join(process.cwd(), 'uploads')
    this.outputBaseDir = config.outputBaseDir || path.join(process.cwd(), 'public', 'processed')
    this.tempDir = config.tempDir || path.join(process.cwd(), 'temp')
    this.maxFileSize = config.maxFileSize || 500 * 1024 * 1024 // 500MB default
    
    this.supportedFormats = new Set([
      '.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.m4v'
    ])
    
    console.log('[CLI File Manager] Initialized with directories:', {
      input: this.inputBaseDir,
      output: this.outputBaseDir,
      temp: this.tempDir
    })
  }

  /**
   * Prepare uploaded file for CLI processing
   */
  async prepareInputFile(uploadedFilePath: string, jobId: string): Promise<PreparedFile> {
    console.log(`[CLI File Manager] Preparing input file for job ${jobId}: ${uploadedFilePath}`)
    
    try {
      // Validate file exists and is accessible
      const stats = await fs.stat(uploadedFilePath)
      
      if (!stats.isFile()) {
        throw new Error('Provided path is not a file')
      }
      
      if (stats.size > this.maxFileSize) {
        throw new Error(`File size (${Math.round(stats.size / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(this.maxFileSize / 1024 / 1024)}MB)`)
      }
      
      // Validate file format
      const ext = path.extname(uploadedFilePath).toLowerCase()
      if (!this.supportedFormats.has(ext)) {
        throw new Error(`Unsupported file format: ${ext}. Supported formats: ${Array.from(this.supportedFormats).join(', ')}`)
      }
      
      // Generate file hash for integrity checking
      const hash = await this.generateFileHash(uploadedFilePath)
      
      // Validate video file and extract metadata
      const validation = await this.validateVideoFile(uploadedFilePath)
      if (!validation.valid) {
        throw new Error(`Invalid video file: ${validation.errors.join(', ')}`)
      }
      
      // Create job-specific input directory
      const jobInputDir = path.join(this.inputBaseDir, jobId)
      await fs.mkdir(jobInputDir, { recursive: true })
      
      // Generate safe filename
      const originalFilename = path.basename(uploadedFilePath)
      const safeFilename = this.generateSafeFilename(originalFilename, hash)
      const preparedPath = path.join(jobInputDir, safeFilename)
      
      // Copy file to prepared location (or move if it's in temp)
      if (uploadedFilePath.startsWith(this.tempDir)) {
        await fs.rename(uploadedFilePath, preparedPath)
      } else {
        await fs.copyFile(uploadedFilePath, preparedPath)
      }
      
      console.log(`[CLI File Manager] File prepared successfully: ${preparedPath}`)
      
      return {
        originalPath: uploadedFilePath,
        preparedPath,
        filename: safeFilename,
        size: stats.size,
        hash,
        metadata: validation.metadata
      }
      
    } catch (error) {
      console.error(`[CLI File Manager] Failed to prepare input file:`, error)
      throw error
    }
  }

  /**
   * Create output directory structure for CLI processing
   */
  async createOutputStructure(userId: string, jobId: string): Promise<string> {
    const outputDir = path.join(this.outputBaseDir, userId, jobId)
    
    try {
      await fs.mkdir(outputDir, { recursive: true })
      
      // Create subdirectories for different output types
      await fs.mkdir(path.join(outputDir, 'clips'), { recursive: true })
      await fs.mkdir(path.join(outputDir, 'thumbnails'), { recursive: true })
      await fs.mkdir(path.join(outputDir, 'metadata'), { recursive: true })
      
      console.log(`[CLI File Manager] Created output structure: ${outputDir}`)
      return outputDir
      
    } catch (error) {
      console.error(`[CLI File Manager] Failed to create output structure:`, error)
      throw new Error('Failed to create output directory structure')
    }
  }

  /**
   * Process CLI output files and organize them
   */
  async processCLIOutput(outputDir: string, jobId: string, platform: string, quality: string): Promise<ProcessedFiles> {
    console.log(`[CLI File Manager] Processing CLI output for job ${jobId}`)
    
    try {
      // Scan output directory for generated files
      const files = await fs.readdir(outputDir)
      const videoFiles = files.filter(file => 
        file.endsWith('.mp4') || file.endsWith('.mov') || file.endsWith('.webm')
      )
      
      if (videoFiles.length === 0) {
        throw new Error('No video files found in CLI output')
      }
      
      const clips: ProcessedFiles['clips'] = []
      let totalSize = 0
      
      // Process each generated clip
      for (let i = 0; i < videoFiles.length; i++) {
        const filename = videoFiles[i]
        const filePath = path.join(outputDir, filename)
        
        try {
          const stats = await fs.stat(filePath)
          const duration = await this.getVideoDuration(filePath)
          
          // Generate public URL
          const relativePath = path.relative(this.outputBaseDir, filePath)
          const publicUrl = `/processed/${relativePath.replace(/\\/g, '/')}`
          
          clips.push({
            filename,
            path: filePath,
            publicUrl,
            size: stats.size,
            duration,
            platform,
            quality
          })
          
          totalSize += stats.size
          
        } catch (error) {
          console.warn(`[CLI File Manager] Failed to process clip ${filename}:`, error)
        }
      }
      
      // Sort clips by filename for consistent ordering
      clips.sort((a, b) => a.filename.localeCompare(b.filename))
      
      // Generate thumbnails for clips
      await this.generateThumbnails(clips, outputDir)
      
      // Create metadata file
      const metadata = {
        totalClips: clips.length,
        totalSize,
        processingTime: 0, // Will be updated by caller
        qualityUsed: quality,
        cliVersion: '2.0' // TODO: Get actual CLI version
      }
      
      await this.saveProcessingMetadata(outputDir, {
        jobId,
        clips: clips.map(c => ({ filename: c.filename, size: c.size, duration: c.duration })),
        metadata,
        timestamp: new Date().toISOString()
      })
      
      console.log(`[CLI File Manager] Processed ${clips.length} clips successfully`)
      
      return { clips, metadata }
      
    } catch (error) {
      console.error(`[CLI File Manager] Failed to process CLI output:`, error)
      throw error
    }
  }

  /**
   * Generate secure download URLs with authentication
   */
  async generateDownloadUrls(files: ProcessedFiles, userId: string, expirationHours: number = 24): Promise<Array<{
    filename: string
    downloadUrl: string
    thumbnailUrl?: string
    expiresAt: Date
  }>> {
    const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000)
    
    return files.clips.map(clip => {
      // Generate signed URL with expiration
      const token = this.generateDownloadToken(clip.filename, userId, expiresAt)
      const downloadUrl = `${clip.publicUrl}?token=${token}&expires=${expiresAt.getTime()}`
      
      // Generate thumbnail URL if thumbnail exists
      const thumbnailFilename = clip.filename.replace(/\.[^/.]+$/, '_thumb.jpg')
      const thumbnailUrl = `${clip.publicUrl.replace(clip.filename, thumbnailFilename)}?token=${token}&expires=${expiresAt.getTime()}`
      
      return {
        filename: clip.filename,
        downloadUrl,
        thumbnailUrl,
        expiresAt
      }
    })
  }

  /**
   * Cleanup temporary and old files
   */
  async cleanup(jobId: string, maxAge?: number): Promise<void> {
    console.log(`[CLI File Manager] Cleaning up files for job ${jobId}`)
    
    try {
      // Clean up input files
      const jobInputDir = path.join(this.inputBaseDir, jobId)
      if (await this.pathExists(jobInputDir)) {
        await fs.rm(jobInputDir, { recursive: true, force: true })
      }
      
      // Clean up old output files if maxAge specified
      if (maxAge) {
        const cutoffTime = Date.now() - maxAge
        const outputDirs = await fs.readdir(this.outputBaseDir)
        
        for (const userDir of outputDirs) {
          const userPath = path.join(this.outputBaseDir, userDir)
          const userStat = await fs.stat(userPath)
          
          if (userStat.isDirectory()) {
            const jobDirs = await fs.readdir(userPath)
            
            for (const jobDir of jobDirs) {
              const jobPath = path.join(userPath, jobDir)
              const jobStat = await fs.stat(jobPath)
              
              if (jobStat.isDirectory() && jobStat.mtime.getTime() < cutoffTime) {
                await fs.rm(jobPath, { recursive: true, force: true })
                console.log(`[CLI File Manager] Cleaned up old job directory: ${jobPath}`)
              }
            }
          }
        }
      }
      
    } catch (error) {
      console.warn(`[CLI File Manager] Cleanup warning:`, error)
    }
  }

  /**
   * Validate video file and extract metadata
   */
  private async validateVideoFile(filePath: string): Promise<FileValidationResult> {
    try {
      // Use ffprobe to get video metadata
      const metadata = await this.getVideoMetadata(filePath)
      
      const errors: string[] = []
      
      // Basic validation
      if (!metadata?.duration || metadata.duration < 1) {
        errors.push('Video duration is too short (minimum 1 second)')
      }
      
      if (metadata?.duration && metadata.duration > 3600) { // 1 hour
        errors.push('Video duration is too long (maximum 1 hour)')
      }
      
      if (!metadata?.resolution) {
        errors.push('Could not determine video resolution')
      }
      
      return {
        valid: errors.length === 0,
        errors,
        metadata: errors.length === 0 ? metadata : undefined
      }
      
    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to validate video file: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  /**
   * Get video metadata using ffprobe
   */
  private async getVideoMetadata(filePath: string): Promise<FileValidationResult['metadata']> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath
      ])
      
      let output = ''
      let error = ''
      
      ffprobe.stdout.on('data', (data) => {
        output += data.toString()
      })
      
      ffprobe.stderr.on('data', (data) => {
        error += data.toString()
      })
      
      ffprobe.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`ffprobe failed: ${error}`))
          return
        }
        
        try {
          const data = JSON.parse(output)
          const videoStream = data.streams.find((s: any) => s.codec_type === 'video')
          
          if (!videoStream) {
            reject(new Error('No video stream found'))
            return
          }
          
          resolve({
            duration: parseFloat(data.format.duration) || 0,
            resolution: `${videoStream.width}x${videoStream.height}`,
            format: data.format.format_name,
            size: parseInt(data.format.size) || 0,
            bitrate: parseInt(data.format.bit_rate) || undefined,
            frameRate: this.parseFrameRate(videoStream.r_frame_rate)
          })
          
        } catch (parseError) {
          reject(new Error(`Failed to parse ffprobe output: ${parseError}`))
        }
      })
      
      ffprobe.on('error', (err) => {
        reject(new Error(`Failed to run ffprobe: ${err.message}`))
      })
    })
  }

  /**
   * Get video duration using ffprobe
   */
  private async getVideoDuration(filePath: string): Promise<number> {
    try {
      const metadata = await this.getVideoMetadata(filePath)
      return metadata?.duration || 0
    } catch (error) {
      console.warn(`[CLI File Manager] Could not get duration for ${filePath}:`, error)
      return 0
    }
  }

  /**
   * Generate thumbnails for video clips
   */
  private async generateThumbnails(clips: ProcessedFiles['clips'], outputDir: string): Promise<void> {
    const thumbnailDir = path.join(outputDir, 'thumbnails')
    
    for (const clip of clips) {
      try {
        const thumbnailFilename = clip.filename.replace(/\.[^/.]+$/, '_thumb.jpg')
        const thumbnailPath = path.join(thumbnailDir, thumbnailFilename)
        
        // Generate thumbnail at 3 seconds into the video
        await new Promise<void>((resolve, reject) => {
          const ffmpeg = spawn('ffmpeg', [
            '-i', clip.path,
            '-ss', '3',
            '-vframes', '1',
            '-q:v', '2',
            '-y',
            thumbnailPath
          ])
          
          ffmpeg.on('close', (code) => {
            if (code === 0) {
              resolve()
            } else {
              reject(new Error(`Thumbnail generation failed with code ${code}`))
            }
          })
          
          ffmpeg.on('error', reject)
        })
        
      } catch (error) {
        console.warn(`[CLI File Manager] Failed to generate thumbnail for ${clip.filename}:`, error)
      }
    }
  }

  /**
   * Generate file hash for integrity checking
   */
  private async generateFileHash(filePath: string): Promise<string> {
    const hash = createHash('sha256')
    const stream = await fs.readFile(filePath)
    hash.update(stream)
    return hash.digest('hex').substring(0, 16) // Use first 16 characters
  }

  /**
   * Generate safe filename
   */
  private generateSafeFilename(originalFilename: string, hash: string): string {
    const ext = path.extname(originalFilename)
    const basename = path.basename(originalFilename, ext)
    const safeName = basename.replace(/[^a-zA-Z0-9_-]/g, '_')
    return `${safeName}_${hash}${ext}`
  }

  /**
   * Generate download token for secure file access
   */
  private generateDownloadToken(filename: string, userId: string, expiresAt: Date): string {
    const data = `${filename}:${userId}:${expiresAt.getTime()}`
    return createHash('sha256').update(data + process.env.JWT_SECRET).digest('hex').substring(0, 32)
  }

  /**
   * Parse frame rate from ffprobe format
   */
  private parseFrameRate(frameRateStr: string): number | undefined {
    if (!frameRateStr) return undefined
    
    const parts = frameRateStr.split('/')
    if (parts.length === 2) {
      const num = parseInt(parts[0])
      const den = parseInt(parts[1])
      return den > 0 ? num / den : undefined
    }
    
    return parseFloat(frameRateStr) || undefined
  }

  /**
   * Save processing metadata to file
   */
  private async saveProcessingMetadata(outputDir: string, metadata: any): Promise<void> {
    const metadataPath = path.join(outputDir, 'metadata', 'processing.json')
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
  }

  /**
   * Check if path exists
   */
  private async pathExists(path: string): Promise<boolean> {
    try {
      await fs.access(path)
      return true
    } catch {
      return false
    }
  }
}

// Singleton instance
export const cliFileManager = new CLIFileManager()

export default CLIFileManager
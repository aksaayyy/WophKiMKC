/**
 * YouTube Video Processor
 * Integrates with Python YouTube utilities for smart chunked downloading
 */

import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'

export interface YouTubeProcessingOptions {
  url: string
  outputDir: string
  quality?: 'standard' | 'high' | 'premium'
  chunkSize?: number
  maxDuration?: number
}

export interface YouTubeProcessingResult {
  success: boolean
  videoPath?: string
  duration?: number
  fileSize?: number
  metadata?: {
    title: string
    uploader: string
    description: string
    thumbnail: string
  }
  error?: string
}

export class YouTubeProcessor {
  private pythonScriptPath: string

  constructor() {
    // Path to the new Python YouTube CLI utilities
    this.pythonScriptPath = path.join(process.cwd(), '..', 'version2', 'youtube_cli.py')
  }

  /**
   * Download YouTube video with smart chunking
   */
  async downloadVideo(options: YouTubeProcessingOptions): Promise<YouTubeProcessingResult> {
    try {
      console.log(`[YouTube] Starting download for: ${options.url}`)
      
      // Ensure output directory exists
      await fs.mkdir(options.outputDir, { recursive: true })
      
      // Prepare Python command arguments - format arguments correctly
      const args = [
        this.pythonScriptPath,
        '--format', 'json',
        'download',
        '--url', options.url,
        '--output-dir', options.outputDir,
        '--quality', this.mapQuality(options.quality || 'standard')
      ]

      if (options.maxDuration) {
        // Note: The CLI doesn't currently support max-duration, so we'll handle it in the Python script
        args.push('--max-duration', String(options.maxDuration))
      }

      // Execute Python script
      const result = await this.executePythonScript(args)
      
      if (result.success && result.data) {
        const videoData = JSON.parse(result.data)
        
        return {
          success: true,
          videoPath: videoData.video_path,
          duration: videoData.duration,
          fileSize: videoData.file_size,
          metadata: {
            title: videoData.title || 'Unknown',
            uploader: videoData.uploader || 'Unknown',
            description: videoData.description || '',
            thumbnail: videoData.thumbnail || ''
          }
        }
      } else {
        return {
          success: false,
          error: result.error || 'Unknown download error'
        }
      }
      
    } catch (error) {
      console.error('[YouTube] Download error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get video information without downloading
   */
  async getVideoInfo(url: string): Promise<YouTubeProcessingResult> {
    try {
      // Prepare Python command arguments - format arguments correctly
      const args = [
        this.pythonScriptPath,
        '--format', 'json',
        'info',
        '--url', url
      ]

      const result = await this.executePythonScript(args)
      
      if (result.success && result.data) {
        const videoData = JSON.parse(result.data)
        
        return {
          success: true,
          duration: videoData.duration,
          metadata: {
            title: videoData.title || 'Unknown',
            uploader: videoData.uploader || 'Unknown',
            description: videoData.description || '',
            thumbnail: videoData.thumbnail || ''
          }
        }
      } else {
        return {
          success: false,
          error: result.error || 'Failed to get video info'
        }
      }
      
    } catch (error) {
      console.error('[YouTube] Info error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Execute Python script with arguments
   */
  private async executePythonScript(args: string[]): Promise<{
    success: boolean
    data?: string
    error?: string
  }> {
    return new Promise((resolve) => {
      let stdout = ''
      let stderr = ''
      
      // Use python3 command with virtual environment
      const pythonProcess = spawn('python3', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PATH: `/Users/rohitkumar/Documents/Woph_ki_maa_ki_ch*t/version2/venv/bin:${process.env.PATH}`
        }
      })

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString()
        // Log stderr for debugging
        console.log('[YouTube Python Script STDERR]:', data.toString())
      })

      pythonProcess.on('close', (code) => {
        console.log(`[YouTube Python Script] Process exited with code ${code}`)
        console.log('[YouTube Python Script STDOUT]:', stdout)
        
        if (code === 0) {
          resolve({
            success: true,
            data: stdout.trim()
          })
        } else {
          resolve({
            success: false,
            error: stderr || `Process exited with code ${code}`
          })
        }
      })

      pythonProcess.on('error', (error) => {
        console.error('[YouTube Python Script] Process error:', error)
        resolve({
          success: false,
          error: error.message
        })
      })

      // Set timeout for long-running downloads
      setTimeout(() => {
        pythonProcess.kill('SIGTERM')
        resolve({
          success: false,
          error: 'Download timeout'
        })
      }, 600000) // 10 minutes timeout
    })
  }

  /**
   * Map web quality settings to Python script quality
   */
  private mapQuality(quality: string): string {
    switch (quality) {
      case 'standard':
        return 'standard'
      case 'high':
        return 'high'
      case 'premium':
        return 'premium'
      default:
        return 'standard'
    }
  }

  /**
   * Validate YouTube URL
   */
  static validateYouTubeUrl(url: string): boolean {
    const patterns = [
      /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/,
      /^https?:\/\/(www\.)?youtube\.com\/shorts\//
    ]
    return patterns.some((pattern) => pattern.test(url))
  }

  /**
   * Extract video ID from YouTube URL
   */
  static extractVideoId(url: string): string | null {
    try {
      const urlObj = new URL(url)
      if (urlObj.hostname.includes('youtu.be')) {
        return urlObj.pathname.slice(1)
      } else if (urlObj.searchParams.has('v')) {
        return urlObj.searchParams.get('v')
      } else if (urlObj.pathname.includes('/shorts/')) {
        return urlObj.pathname.split('/shorts/')[1]
      }
      return null
    } catch {
      return null
    }
  }
}

// Export singleton instance
export const youtubeProcessor = new YouTubeProcessor()
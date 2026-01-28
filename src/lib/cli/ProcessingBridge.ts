import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import { videoJobManager } from '../../../lib/video-job-manager'

const execAsync = promisify(exec)

// Type definitions
import { WebProcessingConfig } from './ConfigurationMapper'

// Type definitions

interface ProcessingOptions {
  userId: string
  jobId: string
  webConfig: WebProcessingConfig
  notifyProgress: boolean
}

interface ProcessingSuggestions {
  estimatedTime: number
  summary: string
  warnings: string[]
}

class ProcessingBridge {
  private static instance: ProcessingBridge
  private processingJobs: Map<string, any> = new Map()

  private constructor() {}

  static getInstance(): ProcessingBridge {
    if (!ProcessingBridge.instance) {
      ProcessingBridge.instance = new ProcessingBridge()
    }
    return ProcessingBridge.instance
  }

  /**
   * Get processing suggestions based on configuration
   */
  getProcessingSuggestions(config: WebProcessingConfig): ProcessingSuggestions {
    // Calculate estimated time based on video duration and processing options
    const baseTime = 30 // Base processing time in seconds
    const qualityMultiplier = config.quality === 'standard' ? 1 : config.quality === 'high' ? 1.5 : 2.5
    const enhancementMultiplier = (config.enhanceAudio ? 1.2 : 1) * (config.colorCorrection ? 1.3 : 1)
    
    const estimatedTime = Math.round(
      baseTime * config.clipCount * qualityMultiplier * enhancementMultiplier
    )

    return {
      estimatedTime,
      summary: `Processing ${config.clipCount} clips with ${config.quality} quality`,
      warnings: config.clipCount > 5 ? ['High clip count may increase processing time'] : []
    }
  }

  /**
   * Start video processing in background
   */
  async startProcessing(options: ProcessingOptions): Promise<void> {
    const { userId, jobId, webConfig, notifyProgress } = options
    
    // Check if we should use external processing (production environment)
    const useExternalProcessing = process.env.NODE_ENV === 'production' && 
                                process.env.EXTERNAL_PROCESSING_URL;
    
    if (useExternalProcessing) {
      console.log(`[ProcessingBridge] Using external processing for job ${jobId}`)
      return this.startExternalProcessing(options);
    }
    
    try {
      // Update job status to processing
      await videoJobManager.updateJobStatus(jobId, 'processing')
      
      // Check if this is a YouTube URL that needs to be downloaded first
      if (webConfig.youtubeMode && this.isYouTubeUrl(webConfig.inputFile)) {
        // Handle YouTube processing
        await this.processYouTubeVideo(options)
      } else {
        // Handle regular file processing
        await this.processRegularVideo(options)
      }
      
    } catch (error) {
      console.error(`[ProcessingBridge] Error starting processing for job ${jobId}:`, error)
      await videoJobManager.updateJobStatus(jobId, 'failed')
      throw error
    }
  }

  /**
   * Process YouTube video by first downloading it
   */
  private async processYouTubeVideo(options: ProcessingOptions): Promise<void> {
    const { userId, jobId, webConfig, notifyProgress } = options
    const youtubeUrl = webConfig.inputFile
    
    console.log(`[ProcessingBridge] Starting YouTube processing for job ${jobId}`)
    
    try {
      // Create temporary directory for YouTube download
      const projectRoot = process.cwd()
      const tempDir = path.join(projectRoot, 'temp_youtube', jobId)
      await fs.mkdir(tempDir, { recursive: true })
      
      // Download YouTube video using youtube_cli.py
      const downloadResult = await this.downloadYouTubeVideo(youtubeUrl, tempDir, webConfig)
      
      if (!downloadResult.success) {
        throw new Error(`YouTube download failed: ${downloadResult.error}`)
      }
      
      // Update webConfig to use the downloaded file instead of YouTube URL
      const updatedWebConfig: WebProcessingConfig = {
        ...webConfig,
        inputFile: downloadResult.videoPath!
      }
      
      // Process the downloaded video file
      await this.processRegularVideo({
        ...options,
        webConfig: updatedWebConfig
      })
      
    } catch (error) {
      console.error(`[ProcessingBridge] YouTube processing failed for job ${jobId}:`, error)
      await videoJobManager.updateJobStatus(jobId, 'failed')
      throw error
    }
  }

  /**
   * Download YouTube video using youtube_cli.py
   */
  private async downloadYouTubeVideo(youtubeUrl: string, outputDir: string, webConfig: WebProcessingConfig): Promise<{ success: boolean; videoPath?: string; error?: string }> {
    return new Promise((resolve, reject) => {
      try {
        // Get project root (go up from .next/server to project root)
        const projectRoot = process.cwd()
        const youtubeCliPath = path.join(projectRoot, 'version2', 'youtube_utils.py')
        const pythonPath = process.env.PYTHON_PATH || '/opt/homebrew/bin/python3'
        
        // Build arguments for youtube_utils.py download function
        // Create a Python script that calls the download function and returns JSON
        const pythonScript = `
import sys
import json
from pathlib import Path
sys.path.insert(0, '${path.join(projectRoot, 'version2').replace(/\\/g, '\\\\')}')

try:
    from youtube_utils import download_youtube_video
    
    video_path, title_or_error = download_youtube_video(
        '${youtubeUrl.replace(/'/g, "\\'")}',
        Path('${outputDir.replace(/\\/g, '\\\\')}'),
        quality='${this.mapYouTubeQuality(webConfig.quality)}'
    )
    
    if video_path:
        print(json.dumps({
            'success': True,
            'video_path': str(video_path),
            'title': title_or_error
        }))
    else:
        print(json.dumps({
            'success': False,
            'error': title_or_error
        }))
except Exception as e:
    print(json.dumps({
        'success': False,
        'error': str(e)
    }))
`
        
        const args = ['-c', pythonScript]
        
        console.log(`[ProcessingBridge] YouTube download command: ${pythonPath} ${args.join(' ')}`)
        
        // Execute Python command
        const child = spawn(pythonPath, args, {
          cwd: projectRoot,
          env: {
            ...process.env,
            PYTHONPATH: path.join(projectRoot, 'version2')
          }
        })
        
        let stdoutBuffer = ''
        let stderrBuffer = ''
        
        child.stdout.on('data', (data) => {
          stdoutBuffer += data.toString()
        })
        
        child.stderr.on('data', (data) => {
          stderrBuffer += data.toString()
        })
        
        child.on('close', (code) => {
          if (code === 0) {
            try {
              // Parse JSON output from youtube_cli.py
              const result = JSON.parse(stdoutBuffer)
              if (result.error) {
                resolve({ success: false, error: result.error })
              } else {
                resolve({ success: true, videoPath: result.video_path })
              }
            } catch (parseError: any) {
              resolve({ success: false, error: `Failed to parse download result: ${parseError.message}` })
            }
          } else {
            resolve({ success: false, error: `Download failed with code ${code}: ${stderrBuffer}` })
          }
        })
        
        child.on('error', (error) => {
          reject(error)
        })
        
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Process regular video file
   */
  private async processRegularVideo(options: ProcessingOptions): Promise<void> {
    const { userId, jobId, webConfig, notifyProgress } = options
    
    try {
      // Map web config to CLI arguments
      const cliArgs = this.mapWebConfigToCLIArgs(webConfig)
      
      // Get project root and CLI tool path
      const projectRoot = process.cwd()
      const cliToolPath = path.join(projectRoot, 'version2', 'integration', 'unified_cli.py')
      const pythonPath = process.env.PYTHON_PATH || '/opt/homebrew/bin/python3'
      
      console.log(`[ProcessingBridge] Starting processing for job ${jobId}`)
      console.log(`[ProcessingBridge] CLI command: ${pythonPath} ${cliToolPath} ${cliArgs.join(' ')}`)
      
      // Execute CLI tool
      const child = spawn(pythonPath, [cliToolPath, ...cliArgs], {
        cwd: projectRoot,
        env: {
          ...process.env,
          PYTHONPATH: path.join(projectRoot, 'version2')
        }
      })
      
      // Track job process
      this.processingJobs.set(jobId, child)
      
      // Handle output
      let stdoutBuffer = ''
      child.stdout.on('data', (data) => {
        const output = data.toString()
        console.log(`[CLI Output] ${output}`)
        stdoutBuffer += output
        
        // Parse progress from output if available
        if (notifyProgress) {
          this.parseProgressAndUpdate(output, jobId)
        }
        
        // Check for JSON result
        const jsonMatch = output.match(/JSON_RESULT: ({.*})/)
        if (jsonMatch) {
          try {
            const result = JSON.parse(jsonMatch[1])
            console.log(`[CLI Result] Processing completed with result:`, result)
            // In a real implementation, you would update the job with the result
          } catch (error) {
            console.error('[CLI Result] Failed to parse JSON result:', error)
          }
        }
      })
      
      child.stderr.on('data', (data) => {
        const error = data.toString()
        console.error(`[CLI Error] ${error}`)
      })
      
      // Handle process completion
      child.on('close', async (code) => {
        this.processingJobs.delete(jobId)
        
        if (code === 0) {
          console.log(`[ProcessingBridge] Processing completed successfully for job ${jobId}`)
          await videoJobManager.updateJobStatus(jobId, 'completed')
          
          // In a real implementation, you would:
          // 1. Scan the output directory for generated clips
          // 2. Update the job with output file paths
          // 3. Calculate processing time
        } else {
          console.error(`[ProcessingBridge] Processing failed for job ${jobId} with code ${code}`)
          await videoJobManager.updateJobStatus(jobId, 'failed')
        }
      })
      
      child.on('error', async (error) => {
        console.error(`[ProcessingBridge] Failed to start process for job ${jobId}:`, error)
        this.processingJobs.delete(jobId)
        await videoJobManager.updateJobStatus(jobId, 'failed')
      })
      
    } catch (error) {
      console.error(`[ProcessingBridge] Error processing video for job ${jobId}:`, error)
      await videoJobManager.updateJobStatus(jobId, 'failed')
      throw error
    }
  }

  /**
   * Map web configuration to CLI arguments
   */
  private mapWebConfigToCLIArgs(config: WebProcessingConfig): string[] {
    const args: string[] = [
      '--input', config.inputFile,
      '--clips', config.clipCount.toString(),
      '--quality', this.mapQuality(config.quality),
      '--platform', config.platform
    ]
    
    // Add advanced options if available
    if (config.advancedOptions) {
      if (config.advancedOptions.minDuration) {
        args.push('--min', config.advancedOptions.minDuration.toString())
      }
      if (config.advancedOptions.maxDuration) {
        args.push('--max', config.advancedOptions.maxDuration.toString())
      }
    }
    
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

  /**
   * Map quality presets
   */
  private mapQuality(quality: string): string {
    const qualityMap: Record<string, string> = {
      'standard': 'social',
      'high': 'pro',
      'premium': 'cinematic'
    }
    return qualityMap[quality] || 'social'
  }

  /**
   * Map quality presets for YouTube download
   */
  private mapYouTubeQuality(quality: string): string {
    const qualityMap: Record<string, string> = {
      'standard': '720p',
      'high': '1080p',
      'premium': 'best'
    }
    return qualityMap[quality] || 'best'
  }

  /**
   * Parse progress from CLI output and update job status
   */
  private parseProgressAndUpdate(output: string, jobId: string): void {
    // Look for progress indicators in the output
    const progressMatch = output.match(/(\d+)%/)
    if (progressMatch) {
      const progress = parseInt(progressMatch[1])
      // In a real implementation, you would update the job progress in the database
      console.log(`[ProcessingBridge] Job ${jobId} progress: ${progress}%`)
    }
  }

  /**
   * Check if a URL is a YouTube URL
   */
  private isYouTubeUrl(url: string): boolean {
    const youtubePatterns = [
      /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/,
      /^https?:\/\/(www\.)?youtube\.com\/shorts\//,
      /^https?:\/\/(www\.)?youtube\.com\/live\//
    ]
    
    return youtubePatterns.some(pattern => pattern.test(url))
  }

  /**
   * Cancel processing job
   */
  async cancelProcessing(jobId: string): Promise<void> {
    const process = this.processingJobs.get(jobId)
    if (process) {
      process.kill('SIGTERM')
      this.processingJobs.delete(jobId)
      await videoJobManager.updateJobStatus(jobId, 'failed')
    }
  }

  /**
   * Start video processing using external service
   */
  private async startExternalProcessing(options: ProcessingOptions): Promise<void> {
    const { userId, jobId, webConfig, notifyProgress } = options;
    const externalUrl = process.env.EXTERNAL_PROCESSING_URL;
    const apiKey = process.env.EXTERNAL_PROCESSING_API_KEY;
    
    if (!externalUrl) {
      throw new Error('EXTERNAL_PROCESSING_URL not configured');
    }
    
    try {
      // Update job status to queued
      await videoJobManager.updateJobStatus(jobId, 'queued');
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
      
      // Send job to external processing service
      const response = await fetch(`${externalUrl}/api/process`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jobId,
          userId,
          config: webConfig
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`External processing failed: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      
      // Update job status based on result
      if (result.success) {
        await videoJobManager.updateJobStatus(jobId, 'completed', {
          output_files: result.outputFiles,
          processing_time: result.processingTime
        });
      } else {
        await videoJobManager.updateJobStatus(jobId, 'failed', {
          error_message: result.error
        });
      }
      
    } catch (error) {
      console.error(`[ProcessingBridge] External processing failed for job ${jobId}:`, error);
      
      // Update job status to failed
      await videoJobManager.updateJobStatus(jobId, 'failed', {
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }
}

// Export singleton instance
export const processingBridge = ProcessingBridge.getInstance()
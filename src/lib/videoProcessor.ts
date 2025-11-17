/**
 * Video Processing Integration
 * Connects the web interface with the Python video processing backend
 * Integrated with database job tracking system
 */

import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { videoJobManager } from '../../lib/video-job-manager'

export interface ProcessingOptions {
  platform: 'tiktok' | 'instagram' | 'youtube' | 'twitter'
  quality: 'standard' | 'high' | 'premium'
  clipCount: number
  enhanceAudio?: boolean
  colorCorrection?: boolean
  smartCrop?: boolean
}

export interface ProcessingJob {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  inputFile: string
  outputFiles: string[]
  options: ProcessingOptions
  createdAt: Date
  completedAt?: Date
  error?: string
}

class VideoProcessorService {
  private jobs = new Map<string, ProcessingJob>()
  private pythonPath: string
  private scriptsPath: string

  constructor() {
    // Path to the Python video processing scripts
    this.pythonPath = process.env.PYTHON_PATH || 'python3'
    this.scriptsPath = path.join(process.cwd(), 'scripts')
  }

  /**
   * Start video processing job with database integration
   */
  async startProcessing(
    inputFile: string, 
    options: ProcessingOptions,
    databaseJobId?: string
  ): Promise<string> {
    const jobId = databaseJobId || `job_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    
    const job: ProcessingJob = {
      id: jobId,
      status: 'queued',
      progress: 0,
      inputFile,
      outputFiles: [],
      options,
      createdAt: new Date()
    }

    this.jobs.set(jobId, job)

    // Update database job status to processing if database job ID provided
    if (databaseJobId) {
      try {
        await videoJobManager.startProcessing(databaseJobId)
      } catch (error) {
        console.error(`Failed to update database job status for ${databaseJobId}:`, error)
      }
    }

    // Start processing in background
    this.processVideo(jobId, databaseJobId).catch(error => {
      console.error(`Processing failed for job ${jobId}:`, error)
      const failedJob = this.jobs.get(jobId)
      if (failedJob) {
        failedJob.status = 'failed'
        failedJob.error = error.message
      }

      // Update database job status to failed if database job ID provided
      if (databaseJobId) {
        videoJobManager.failJob(databaseJobId, error.message).catch((dbError: any) => {
          console.error(`Failed to update database job failure for ${databaseJobId}:`, dbError)
        })
      }
    })

    return jobId
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): ProcessingJob | null {
    return this.jobs.get(jobId) || null
  }

  /**
   * Get all jobs
   */
  getAllJobs(): ProcessingJob[] {
    return Array.from(this.jobs.values())
  }

  /**
   * Process video using Python backend with database integration
   */
  private async processVideo(jobId: string, databaseJobId?: string): Promise<void> {
    const job = this.jobs.get(jobId)
    if (!job) throw new Error('Job not found')

    job.status = 'processing'
    job.progress = 10

    const startTime = Date.now()

    try {
      // Update file size in database if we have the database job ID
      if (databaseJobId) {
        try {
          const stats = await fs.stat(job.inputFile)
          await videoJobManager.updateJobStatus(databaseJobId, 'processing', {
            original_filesize: stats.size
          })
        } catch (error) {
          console.error(`Failed to update file size for ${databaseJobId}:`, error)
        }
      }

      // Prepare Python script arguments
      const outputDir = path.join(process.cwd(), 'public', 'processed', jobId)
      await fs.mkdir(outputDir, { recursive: true })
      
      const args = [
        path.join(process.cwd(), 'scripts', 'process_video.py'),
        '--input', job.inputFile,
        '--platform', job.options.platform,
        '--quality', job.options.quality,
        '--clips', job.options.clipCount.toString(),
        '--output-dir', outputDir
      ]

      // Add optional enhancements
      if (job.options.enhanceAudio) args.push('--enhance-audio')
      if (job.options.colorCorrection) args.push('--color-correction')
      if (job.options.smartCrop) args.push('--smart-crop')

      // Execute Python processing script
      await this.executePythonScript(args, (progress) => {
        job.progress = Math.min(progress, 95)
      })

      // Get output files and convert to public URLs
      const files = await fs.readdir(outputDir)
      const outputFiles = files
        .filter(file => file.endsWith('.mp4')) // Only include video files
        .map(file => `/processed/${jobId}/${file}`)
      
      job.outputFiles = outputFiles
      job.status = 'completed'
      job.progress = 100
      job.completedAt = new Date()

      // Calculate processing time
      const processingTime = Math.round((Date.now() - startTime) / 1000)

      // Update database job status to completed if database job ID provided
      if (databaseJobId) {
        try {
          await videoJobManager.completeJob(databaseJobId, outputFiles, processingTime)
        } catch (error) {
          console.error(`Failed to update database job completion for ${databaseJobId}:`, error)
        }
      }

    } catch (error) {
      job.status = 'failed'
      job.error = error instanceof Error ? error.message : 'Unknown error'
      
      // Update database job status to failed if database job ID provided
      if (databaseJobId) {
        try {
          await videoJobManager.failJob(databaseJobId, job.error)
        } catch (dbError) {
          console.error(`Failed to update database job failure for ${databaseJobId}:`, dbError)
        }
      }
      
      throw error
    }
  }

  /**
   * Execute Python script with progress tracking
   */
  private executePythonScript(
    args: string[], 
    onProgress: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = spawn(this.pythonPath, args)
      let output = ''
      let errorOutput = ''

      process.stdout.on('data', (data) => {
        output += data.toString()
        
        // Parse progress from output (assuming the Python script outputs progress)
        const progressMatch = output.match(/Progress: (\d+)%/)
        if (progressMatch) {
          const progress = parseInt(progressMatch[1])
          onProgress(progress)
        }
      })

      process.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      process.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Python script failed with code ${code}: ${errorOutput}`))
        }
      })

      process.on('error', (error) => {
        reject(error)
      })
    })
  }

  /**
   * Clean up old jobs and files
   */
  async cleanup(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    const now = Date.now()
    const jobsToDelete: string[] = []

    // Convert Map entries to array for iteration
    const jobEntries = Array.from(this.jobs.entries())
    
    for (const [jobId, job] of jobEntries) {
      if (now - job.createdAt.getTime() > maxAge) {
        jobsToDelete.push(jobId)
        
        // Clean up output files
        try {
          const outputDir = path.join(process.cwd(), 'public', 'processed', jobId)
          await fs.rm(outputDir, { recursive: true, force: true })
        } catch (error) {
          console.warn(`Failed to clean up files for job ${jobId}:`, error)
        }
      }
    }

    jobsToDelete.forEach(jobId => this.jobs.delete(jobId))
  }
}

// Singleton instance
export const videoProcessor = new VideoProcessorService()

// Cleanup old jobs every hour
setInterval(() => {
  videoProcessor.cleanup().catch(console.error)
}, 60 * 60 * 1000)
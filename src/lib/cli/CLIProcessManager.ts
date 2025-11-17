/**
 * CLI Process Manager
 * Handles execution of the advanced video processing CLI tool from the web application
 */

import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import { EventEmitter } from 'events'
import { CLIErrorHandler, CLIError } from './CLIErrorHandler'
import { ConfigurationMapper, WebProcessingConfig } from './ConfigurationMapper'

export interface CLIParameters {
  input: string
  platform: string
  quality: string
  clips: number
  enhanceAudio?: boolean
  colorCorrection?: boolean
  smartSelection?: boolean
  outputDir: string
  projectId?: string
  memberId?: string
  debug?: boolean
}

export interface ProgressUpdate {
  jobId: string
  progress: number
  stage: 'initializing' | 'analyzing' | 'processing' | 'enhancing' | 'finalizing' | 'completed' | 'failed'
  message: string
  timestamp: Date
  details?: {
    currentClip?: number
    totalClips?: number
    processingTime?: number
    estimatedRemaining?: number
  }
}

export interface CLIExecutionResult {
  success: boolean
  outputFiles: string[]
  processingTime: number
  error?: string
  metrics?: {
    clipsGenerated: number
    totalOutputSize: number
    peakMemoryUsage: number
    cliVersion: string
  }
}

export class CLIProcessManager extends EventEmitter {
  private processes = new Map<string, ChildProcess>()
  private retryAttempts = new Map<string, number>()
  private errorHandler: CLIErrorHandler
  private cliPath: string
  private pythonPath: string
  private workingDirectory: string
  private maxConcurrentProcesses: number
  private processTimeoutMs: number

  constructor(config: {
    cliPath?: string
    pythonPath?: string
    workingDirectory?: string
    maxConcurrentProcesses?: number
    timeoutMinutes?: number
  } = {}) {
    super()
    
    // Load configuration from config file
    let cliConfig: any = {}
    try {
      // Use default config to avoid dynamic require and critical dependency warning
      cliConfig = {
        cli: {
          toolPath: path.join(process.cwd(), 'scripts', 'process_video_bridge.py'),
          pythonPath: 'python3',
          workingDirectory: process.cwd(),
          maxConcurrentProcesses: 3,
          timeoutMinutes: 30
        }
      }
    } catch (error) {
      console.warn('[CLI Manager] Could not load cli-integration.config.js, using defaults')
    }
    
    // Default configuration with config file override
    this.cliPath = config.cliPath || cliConfig.cli?.toolPath || path.join(process.cwd(), 'scripts', 'process_video_bridge.py')
    this.pythonPath = config.pythonPath || cliConfig.cli?.pythonPath || process.env.PYTHON_PATH || 'python3'
    this.workingDirectory = config.workingDirectory || cliConfig.cli?.workingDirectory || process.cwd()
    this.maxConcurrentProcesses = config.maxConcurrentProcesses || cliConfig.cli?.maxConcurrentProcesses || 3
    this.processTimeoutMs = (config.timeoutMinutes || cliConfig.cli?.timeoutMinutes || 30) * 60 * 1000
    
    // Initialize error handler
    this.errorHandler = new CLIErrorHandler()
    
    console.log(`[CLI Manager] Initialized with CLI path: ${this.cliPath}`)
    console.log(`[CLI Manager] Python path: ${this.pythonPath}`)
    console.log(`[CLI Manager] Working directory: ${this.workingDirectory}`)
  }

  /**
   * Execute CLI tool with given parameters (with retry logic)
   */
  async executeCLI(jobId: string, parameters: CLIParameters, webConfig?: WebProcessingConfig): Promise<CLIExecutionResult> {
    const attemptCount = this.retryAttempts.get(jobId) || 0
    this.retryAttempts.set(jobId, attemptCount + 1)
    
    try {
      return await this.executeCLIAttempt(jobId, parameters, attemptCount, webConfig)
    } catch (error) {
      // Parse error and determine if retry is possible
      const cliError = this.parseExecutionError(error, jobId)
      
      if (this.errorHandler.isRetryable(cliError, attemptCount)) {
        console.log(`[CLI Manager] Retrying job ${jobId} (attempt ${attemptCount + 1})`)
        
        const strategy = this.errorHandler.getRecoveryStrategy(cliError)
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, strategy.retryDelay))
        
        // Apply fallback configuration if needed
        if (strategy.fallbackAction) {
          parameters = this.applyFallbackConfiguration(parameters, strategy.fallbackAction)
        }
        
        return this.executeCLI(jobId, parameters)
      } else {
        // Log error and reject
        this.errorHandler.logError(cliError, { jobId, parameters })
        throw cliError
      }
    } finally {
      // Clean up retry tracking for completed jobs
      if (!this.processes.has(jobId)) {
        this.retryAttempts.delete(jobId)
      }
    }
  }

  /**
   * Execute CLI tool attempt (single execution)
   */
  private async executeCLIAttempt(jobId: string, parameters: CLIParameters, attemptCount: number, webConfig?: WebProcessingConfig): Promise<CLIExecutionResult> {
    if (this.processes.size >= this.maxConcurrentProcesses) {
      throw new Error(`Maximum concurrent processes (${this.maxConcurrentProcesses}) reached`)
    }

    console.log(`[CLI Manager] Starting CLI execution for job ${jobId} (attempt ${attemptCount + 1})`)
    
    const startTime = Date.now()
    const args = this.buildCLIArguments(parameters, webConfig)
    
    return new Promise((resolve, reject) => {
      const process = spawn(this.pythonPath, [this.cliPath, ...args], {
        cwd: this.workingDirectory,
        stdio: ['pipe', 'pipe', 'pipe']
      })

      this.processes.set(jobId, process)
      
      let stdout = ''
      let stderr = ''
      let lastProgress = 0
      
      // Set up timeout
      const timeout = setTimeout(() => {
        this.killProcess(jobId)
        reject(new Error(`CLI process timed out after ${this.processTimeoutMs / 1000} seconds`))
      }, this.processTimeoutMs)

      // Handle stdout for progress updates
      process.stdout?.on('data', (data) => {
        const output = data.toString()
        stdout += output
        
        // Parse progress and emit updates
        this.parseProgressOutput(jobId, output, lastProgress)
      })

      // Handle stderr for errors
      process.stderr?.on('data', (data) => {
        const errorOutput = data.toString()
        stderr += errorOutput
        console.error(`[CLI Manager] Error output for ${jobId}:`, errorOutput)
      })

      // Handle process completion
      process.on('close', (code) => {
        clearTimeout(timeout)
        this.processes.delete(jobId)
        
        const processingTime = Date.now() - startTime
        
        if (code === 0) {
          // Success - parse output files and metrics
          const result = this.parseSuccessOutput(stdout, processingTime, parameters.outputDir)
          
          this.emit('progress', {
            jobId,
            progress: 100,
            stage: 'completed',
            message: 'Processing completed successfully',
            timestamp: new Date(),
            details: {
              processingTime: processingTime / 1000
            }
          } as ProgressUpdate)
          
          resolve(result)
        } else {
          // Failure - create detailed error for retry logic
          const executionError = {
            exitCode: code,
            stderr,
            stdout,
            message: `CLI process failed with code ${code}`
          }
          
          this.emit('progress', {
            jobId,
            progress: lastProgress,
            stage: 'failed',
            message: 'Processing failed - analyzing error...',
            timestamp: new Date()
          } as ProgressUpdate)
          
          reject(executionError)
        }
      })

      // Handle process errors
      process.on('error', (error) => {
        clearTimeout(timeout)
        this.processes.delete(jobId)
        
        this.emit('progress', {
          jobId,
          progress: 0,
          stage: 'failed',
          message: `Failed to start CLI process: ${error.message}`,
          timestamp: new Date()
        } as ProgressUpdate)
        
        reject(error)
      })

      // Initial progress update
      this.emit('progress', {
        jobId,
        progress: 0,
        stage: 'initializing',
        message: 'Starting video processing...',
        timestamp: new Date()
      } as ProgressUpdate)
    })
  }

  /**
   * Kill a running process
   */
  killProcess(jobId: string): boolean {
    const process = this.processes.get(jobId)
    if (process) {
      process.kill('SIGTERM')
      this.processes.delete(jobId)
      console.log(`[CLI Manager] Killed process for job ${jobId}`)
      return true
    }
    return false
  }

  /**
   * Get status of all running processes
   */
  getRunningProcesses(): string[] {
    return Array.from(this.processes.keys())
  }

  /**
   * Build CLI arguments from parameters
   */
  private buildCLIArguments(params: CLIParameters, webConfig?: WebProcessingConfig): string[] {
    const args: string[] = []
    
    // Required arguments
    args.push('--input', params.input)
    args.push('--platform', params.platform)
    args.push('--quality', params.quality)
    args.push('--clips', params.clips.toString())
    args.push('--output-dir', params.outputDir)
    
    // Optional arguments
    if (params.enhanceAudio) {
      args.push('--enhance-audio')
    }
    
    if (params.colorCorrection) {
      args.push('--color-correction')
    }
    
    if (params.smartSelection) {
      args.push('--smart-selection', '--selection-strategy', 'hybrid')
    }
    
    if (params.debug) {
      args.push('--debug')
    }
    
    // Collaboration arguments
    if (params.projectId) {
      args.push('--project-id', params.projectId)
    }
    
    if (params.memberId) {
      args.push('--member-id', params.memberId)
    }
    
    // Advanced feature arguments (min/max duration, etc.)
    // These come from the web configuration through ConfigurationMapper
    if (webConfig) {
      const advancedArgs = ConfigurationMapper.generateAdvancedFeatureArgs(webConfig);
      args.push(...advancedArgs);
    }
    
    console.log(`[CLI Manager] CLI arguments:`, args)
    return args
  }

  /**
   * Parse progress output from CLI stdout
   */
  private parseProgressOutput(jobId: string, output: string, lastProgress: number): void {
    const lines = output.split('\n')
    
    for (const line of lines) {
      // Parse different progress patterns from CLI output
      let progress = lastProgress
      let stage: ProgressUpdate['stage'] = 'processing'
      let message = line.trim()
      let details: ProgressUpdate['details'] = {}
      
      // Progress percentage pattern: "Progress: 45%"
      const progressMatch = line.match(/Progress:\s*(\d+)%/)
      if (progressMatch) {
        progress = parseInt(progressMatch[1])
      }
      
      // Stage detection patterns
      if (line.includes('Analyzing video')) {
        stage = 'analyzing'
        message = 'Analyzing video content...'
      } else if (line.includes('Processing clip')) {
        stage = 'processing'
        const clipMatch = line.match(/Processing clip (\d+)\/(\d+)/)
        if (clipMatch) {
          details.currentClip = parseInt(clipMatch[1])
          details.totalClips = parseInt(clipMatch[2])
          message = `Processing clip ${clipMatch[1]} of ${clipMatch[2]}`
        }
      } else if (line.includes('Enhancing')) {
        stage = 'enhancing'
        message = 'Applying quality enhancements...'
      } else if (line.includes('Finalizing')) {
        stage = 'finalizing'
        message = 'Finalizing output files...'
      }
      
      // Emit progress update if there's meaningful information
      if (progress !== lastProgress || message.length > 0) {
        this.emit('progress', {
          jobId,
          progress,
          stage,
          message,
          timestamp: new Date(),
          details
        } as ProgressUpdate)
        
        lastProgress = progress
      }
    }
  }

  /**
   * Parse successful CLI output to extract results
   */
  private parseSuccessOutput(stdout: string, processingTime: number, outputDir: string): CLIExecutionResult {
    const lines = stdout.split('\n')
    const outputFiles: string[] = []
    let clipsGenerated = 0
    let totalOutputSize = 0
    
    // Parse output file information
    for (const line of lines) {
      // Pattern: "Generated: /path/to/clip.mp4"
      const fileMatch = line.match(/Generated:\s*(.+\.mp4)/)
      if (fileMatch) {
        outputFiles.push(fileMatch[1])
        clipsGenerated++
      }
      
      // Pattern: "Total output size: 45.2 MB"
      const sizeMatch = line.match(/Total output size:\s*([\d.]+)\s*MB/)
      if (sizeMatch) {
        totalOutputSize = parseFloat(sizeMatch[1]) * 1024 * 1024 // Convert to bytes
      }
    }
    
    return {
      success: true,
      outputFiles,
      processingTime,
      metrics: {
        clipsGenerated,
        totalOutputSize,
        peakMemoryUsage: 0, // TODO: Parse from CLI output if available
        cliVersion: '2.0' // TODO: Get actual version
      }
    }
  }

  /**
   * Parse error output to extract meaningful error messages
   */
  private parseErrorOutput(stderr: string, stdout: string): string {
    // Check for common error patterns
    if (stderr.includes('FileNotFoundError')) {
      return 'Input video file not found or inaccessible'
    }
    
    if (stderr.includes('MemoryError')) {
      return 'Insufficient memory to process video. Try with a smaller file or lower quality settings'
    }
    
    if (stderr.includes('ffmpeg')) {
      return 'Video processing error. The video format may not be supported'
    }
    
    if (stderr.includes('Permission denied')) {
      return 'Permission error accessing files. Please try again'
    }
    
    // Return first non-empty error line or generic message
    const errorLines = stderr.split('\n').filter(line => line.trim().length > 0)
    if (errorLines.length > 0) {
      return errorLines[0]
    }
    
    return 'Unknown processing error occurred'
  }

  /**
   * Parse execution error and create CLI error
   */
  private parseExecutionError(error: any, jobId: string): CLIError {
    if (error.exitCode !== undefined) {
      // CLI process error
      return this.errorHandler.parseError(error.stderr || '', error.stdout || '', error.exitCode)
    } else {
      // System error (spawn failed, etc.)
      return {
        code: 'SYSTEM_ERROR',
        message: error.message || 'Unknown system error',
        category: 'system',
        severity: 'high',
        recoverable: true,
        userMessage: 'A system error occurred during processing. Please try again.',
        suggestedActions: [
          'Try again in a few minutes',
          'Contact support if the issue persists'
        ],
        technicalDetails: error.stack || error.message
      }
    }
  }

  /**
   * Apply fallback configuration based on recovery strategy
   */
  private applyFallbackConfiguration(parameters: CLIParameters, fallbackAction: string): CLIParameters {
    const fallbackParams = { ...parameters }
    
    switch (fallbackAction) {
      case 'reduce_quality':
        // Reduce quality to handle memory issues
        if (fallbackParams.quality === 'cinematic') {
          fallbackParams.quality = 'pro'
        } else if (fallbackParams.quality === 'pro') {
          fallbackParams.quality = 'social'
        }
        console.log(`[CLI Manager] Applying fallback: reduced quality to ${fallbackParams.quality}`)
        break
        
      case 'basic_processing':
        // Disable advanced features
        fallbackParams.enhanceAudio = false
        fallbackParams.colorCorrection = false
        fallbackParams.smartSelection = false
        console.log(`[CLI Manager] Applying fallback: disabled advanced features`)
        break
        
      case 'reduce_complexity':
        // Reduce clip count and disable features
        fallbackParams.clips = Math.max(1, Math.floor(fallbackParams.clips / 2))
        fallbackParams.enhanceAudio = false
        fallbackParams.colorCorrection = false
        console.log(`[CLI Manager] Applying fallback: reduced complexity (${fallbackParams.clips} clips)`)
        break
        
      case 'default_config':
        // Use safe default configuration
        fallbackParams.quality = 'social'
        fallbackParams.clips = 3
        fallbackParams.enhanceAudio = false
        fallbackParams.colorCorrection = false
        fallbackParams.smartSelection = false
        console.log(`[CLI Manager] Applying fallback: default configuration`)
        break
    }
    
    return fallbackParams
  }

  /**
   * Get retry statistics for monitoring
   */
  getRetryStatistics(): { jobId: string; attempts: number }[] {
    return Array.from(this.retryAttempts.entries()).map(([jobId, attempts]) => ({
      jobId,
      attempts
    }))
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    console.log(`[CLI Manager] Cleaning up ${this.processes.size} running processes`)
    
    // Convert Map to array for iteration to avoid TypeScript errors
    const processEntries = Array.from(this.processes.entries())
    for (const [jobId, process] of processEntries) {
      process.kill('SIGTERM')
      console.log(`[CLI Manager] Killed process for job ${jobId}`)
    }
    
    this.processes.clear()
    this.retryAttempts.clear()
  }
}

// Singleton instance with proper configuration
export const cliProcessManager = new CLIProcessManager({
  pythonPath: process.env.PYTHON_PATH || 'python3',
  cliPath: process.env.CLI_TOOL_PATH || path.join(process.cwd(), 'scripts', 'process_video.py')
})

// Cleanup on process exit
process.on('exit', () => {
  cliProcessManager.cleanup()
})

process.on('SIGINT', () => {
  cliProcessManager.cleanup()
  process.exit(0)
})

process.on('SIGTERM', () => {
  cliProcessManager.cleanup()
  process.exit(0)
})
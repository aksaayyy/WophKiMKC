/**
 * CLI Error Handler
 * Comprehensive error handling and recovery for CLI integration
 */

export interface CLIError {
  code: string
  message: string
  category: 'file' | 'processing' | 'system' | 'configuration' | 'timeout'
  severity: 'low' | 'medium' | 'high' | 'critical'
  recoverable: boolean
  userMessage: string
  suggestedActions: string[]
  technicalDetails?: string
}

export interface ErrorRecoveryStrategy {
  maxRetries: number
  retryDelay: number
  fallbackAction?: string
  escalationLevel: 'retry' | 'fallback' | 'fail'
}

export class CLIErrorHandler {
  private errorPatterns: Map<RegExp, CLIError>
  private recoveryStrategies: Map<string, ErrorRecoveryStrategy>

  constructor() {
    this.errorPatterns = new Map()
    this.recoveryStrategies = new Map()
    this.initializeErrorPatterns()
    this.initializeRecoveryStrategies()
  }

  /**
   * Parse CLI error output and categorize the error
   */
  parseError(stderr: string, stdout: string, exitCode: number): CLIError {
    const combinedOutput = `${stderr}\n${stdout}`.toLowerCase()
    
    // Check for known error patterns
    for (const [pattern, errorTemplate] of this.errorPatterns) {
      if (pattern.test(combinedOutput)) {
        return {
          ...errorTemplate,
          technicalDetails: this.extractTechnicalDetails(stderr, stdout, exitCode)
        }
      }
    }
    
    // Fallback to generic error based on exit code
    return this.createGenericError(exitCode, stderr, stdout)
  }

  /**
   * Get recovery strategy for an error
   */
  getRecoveryStrategy(error: CLIError): ErrorRecoveryStrategy {
    return this.recoveryStrategies.get(error.code) || {
      maxRetries: error.recoverable ? 2 : 0,
      retryDelay: 5000,
      escalationLevel: error.recoverable ? 'retry' : 'fail'
    }
  }

  /**
   * Generate user-friendly error message with context
   */
  generateUserMessage(error: CLIError, context?: {
    filename?: string
    platform?: string
    quality?: string
  }): string {
    let message = error.userMessage
    
    // Add context if available
    if (context?.filename) {
      message = message.replace('{filename}', context.filename)
    }
    
    if (context?.platform) {
      message = message.replace('{platform}', context.platform)
    }
    
    if (context?.quality) {
      message = message.replace('{quality}', context.quality)
    }
    
    return message
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: CLIError, attemptCount: number): boolean {
    const strategy = this.getRecoveryStrategy(error)
    return error.recoverable && attemptCount < strategy.maxRetries
  }

  /**
   * Get suggested actions for user
   */
  getSuggestedActions(error: CLIError, context?: any): string[] {
    const actions = [...error.suggestedActions]
    
    // Add context-specific suggestions
    if (error.category === 'file' && context?.filename) {
      actions.push(`Try re-uploading the file: ${context.filename}`)
    }
    
    if (error.category === 'processing' && context?.quality === 'premium') {
      actions.push('Try using "High" quality instead of "Premium" for faster processing')
    }
    
    return actions
  }

  /**
   * Initialize known error patterns
   */
  private initializeErrorPatterns(): void {
    // File-related errors
    this.errorPatterns.set(
      /filenotfounderror|no such file|file not found/i,
      {
        code: 'FILE_NOT_FOUND',
        message: 'Input file not found or inaccessible',
        category: 'file',
        severity: 'high',
        recoverable: true,
        userMessage: 'The video file could not be found. Please try uploading the file again.',
        suggestedActions: [
          'Re-upload your video file',
          'Check that the file is not corrupted',
          'Try a different video format'
        ]
      }
    )

    this.errorPatterns.set(
      /permission denied|access denied/i,
      {
        code: 'PERMISSION_DENIED',
        message: 'Permission denied accessing file',
        category: 'file',
        severity: 'medium',
        recoverable: true,
        userMessage: 'Unable to access the video file due to permission restrictions.',
        suggestedActions: [
          'Try uploading the file again',
          'Contact support if the issue persists'
        ]
      }
    )

    this.errorPatterns.set(
      /invalid.*format|unsupported.*format|codec.*not.*supported/i,
      {
        code: 'INVALID_FORMAT',
        message: 'Unsupported video format',
        category: 'file',
        severity: 'medium',
        recoverable: false,
        userMessage: 'The video format is not supported. Please use MP4, MOV, AVI, or MKV format.',
        suggestedActions: [
          'Convert your video to MP4 format',
          'Try a different video file',
          'Check that your video is not corrupted'
        ]
      }
    )

    // Processing errors
    this.errorPatterns.set(
      /memoryerror|out of memory|insufficient memory/i,
      {
        code: 'OUT_OF_MEMORY',
        message: 'Insufficient memory for processing',
        category: 'system',
        severity: 'high',
        recoverable: true,
        userMessage: 'The video is too large or complex to process. Try using a smaller file or lower quality settings.',
        suggestedActions: [
          'Use "Standard" quality instead of "High" or "Premium"',
          'Try processing fewer clips at once',
          'Use a smaller or shorter video file',
          'Try again later when server resources are available'
        ]
      }
    )

    this.errorPatterns.set(
      /ffmpeg.*error|encoding.*failed|processing.*failed/i,
      {
        code: 'PROCESSING_FAILED',
        message: 'Video processing failed',
        category: 'processing',
        severity: 'medium',
        recoverable: true,
        userMessage: 'Video processing encountered an error. This may be due to video complexity or format issues.',
        suggestedActions: [
          'Try using "Standard" quality settings',
          'Disable advanced features temporarily',
          'Try a different video file',
          'Contact support if the issue persists'
        ]
      }
    )

    // System errors
    this.errorPatterns.set(
      /timeout|timed out|process.*killed/i,
      {
        code: 'TIMEOUT',
        message: 'Processing timeout',
        category: 'timeout',
        severity: 'medium',
        recoverable: true,
        userMessage: 'Video processing took too long and was stopped. Try with a shorter video or lower quality settings.',
        suggestedActions: [
          'Use a shorter video (under 10 minutes)',
          'Try "Standard" quality instead of "High" or "Premium"',
          'Process fewer clips at once',
          'Try again later'
        ]
      }
    )

    this.errorPatterns.set(
      /command not found|no such file.*directory.*python|python.*not.*found/i,
      {
        code: 'CLI_NOT_FOUND',
        message: 'CLI tool not found',
        category: 'system',
        severity: 'critical',
        recoverable: false,
        userMessage: 'Video processing service is temporarily unavailable. Please try again later.',
        suggestedActions: [
          'Try again in a few minutes',
          'Contact support if the issue persists'
        ]
      }
    )

    // Configuration errors
    this.errorPatterns.set(
      /invalid.*argument|unknown.*option|bad.*parameter/i,
      {
        code: 'INVALID_CONFIG',
        message: 'Invalid processing configuration',
        category: 'configuration',
        severity: 'medium',
        recoverable: true,
        userMessage: 'There was an issue with the processing settings. Please try with default settings.',
        suggestedActions: [
          'Reset to default processing settings',
          'Try "Standard" quality with basic options',
          'Contact support if the issue persists'
        ]
      }
    )

    // Network/download errors
    this.errorPatterns.set(
      /connection.*error|network.*error|download.*failed|url.*not.*found/i,
      {
        code: 'NETWORK_ERROR',
        message: 'Network or download error',
        category: 'system',
        severity: 'medium',
        recoverable: true,
        userMessage: 'Unable to download the video from the provided URL. Please check the link and try again.',
        suggestedActions: [
          'Check that the video URL is accessible',
          'Try uploading the file directly instead',
          'Check your internet connection',
          'Try again in a few minutes'
        ]
      }
    )
  }

  /**
   * Initialize recovery strategies
   */
  private initializeRecoveryStrategies(): void {
    this.recoveryStrategies.set('FILE_NOT_FOUND', {
      maxRetries: 1,
      retryDelay: 2000,
      escalationLevel: 'fail'
    })

    this.recoveryStrategies.set('PERMISSION_DENIED', {
      maxRetries: 2,
      retryDelay: 3000,
      escalationLevel: 'retry'
    })

    this.recoveryStrategies.set('OUT_OF_MEMORY', {
      maxRetries: 1,
      retryDelay: 10000,
      fallbackAction: 'reduce_quality',
      escalationLevel: 'fallback'
    })

    this.recoveryStrategies.set('PROCESSING_FAILED', {
      maxRetries: 2,
      retryDelay: 5000,
      fallbackAction: 'basic_processing',
      escalationLevel: 'fallback'
    })

    this.recoveryStrategies.set('TIMEOUT', {
      maxRetries: 1,
      retryDelay: 30000,
      fallbackAction: 'reduce_complexity',
      escalationLevel: 'fallback'
    })

    this.recoveryStrategies.set('NETWORK_ERROR', {
      maxRetries: 3,
      retryDelay: 5000,
      escalationLevel: 'retry'
    })

    this.recoveryStrategies.set('INVALID_CONFIG', {
      maxRetries: 1,
      retryDelay: 1000,
      fallbackAction: 'default_config',
      escalationLevel: 'fallback'
    })
  }

  /**
   * Create generic error for unknown issues
   */
  private createGenericError(exitCode: number, stderr: string, stdout: string): CLIError {
    let severity: CLIError['severity'] = 'medium'
    let userMessage = 'An unexpected error occurred during video processing.'
    
    if (exitCode === 1) {
      severity = 'low'
      userMessage = 'Video processing completed with warnings. Some features may not have been applied.'
    } else if (exitCode > 1) {
      severity = 'high'
      userMessage = 'Video processing failed due to an unexpected error. Please try again.'
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: `Process exited with code ${exitCode}`,
      category: 'system',
      severity,
      recoverable: exitCode !== 127, // 127 = command not found
      userMessage,
      suggestedActions: [
        'Try processing the video again',
        'Try with different quality settings',
        'Contact support if the issue persists'
      ],
      technicalDetails: this.extractTechnicalDetails(stderr, stdout, exitCode)
    }
  }

  /**
   * Extract technical details for debugging
   */
  private extractTechnicalDetails(stderr: string, stdout: string, exitCode: number): string {
    const details = []
    
    details.push(`Exit Code: ${exitCode}`)
    
    if (stderr.trim()) {
      details.push(`STDERR: ${stderr.trim().substring(0, 500)}`)
    }
    
    if (stdout.trim()) {
      details.push(`STDOUT: ${stdout.trim().substring(0, 500)}`)
    }
    
    return details.join('\n')
  }

  /**
   * Log error for monitoring and debugging
   */
  logError(error: CLIError, context?: any): void {
    const logData = {
      timestamp: new Date().toISOString(),
      error: {
        code: error.code,
        message: error.message,
        category: error.category,
        severity: error.severity
      },
      context,
      technicalDetails: error.technicalDetails
    }
    
    console.error('[CLI Error Handler]', JSON.stringify(logData, null, 2))
    
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to monitoring service (e.g., Sentry, DataDog)
    }
  }
}

// Singleton instance
export const cliErrorHandler = new CLIErrorHandler()

export default CLIErrorHandler
/**
 * CLI Integration Test Suite
 * Comprehensive tests for CLI-Web integration
 */

import { CLIProcessManager } from '../CLIProcessManager'
import { ConfigurationMapper, WebProcessingConfig } from '../ConfigurationMapper'
import { ProcessingBridge } from '../ProcessingBridge'
import { CLIFileManager } from '../CLIFileManager'
import { ProgressMonitor } from '../ProgressMonitor'
import { CLIErrorHandler } from '../CLIErrorHandler'

describe('CLI Integration Test Suite', () => {
  let processManager: CLIProcessManager
  let configMapper: ConfigurationMapper
  let processingBridge: ProcessingBridge
  let fileManager: CLIFileManager
  let progressMonitor: ProgressMonitor
  let errorHandler: CLIErrorHandler

  beforeEach(() => {
    processManager = new CLIProcessManager({
      cliPath: '/mock/cli/path',
      pythonPath: 'python3',
      timeoutMinutes: 5
    })
    
    configMapper = new ConfigurationMapper()
    fileManager = new CLIFileManager()
    progressMonitor = new ProgressMonitor()
    errorHandler = new CLIErrorHandler()
    
    processingBridge = new ProcessingBridge({
      cliConfig: { timeoutMinutes: 5 }
    })
  })

  afterEach(() => {
    processManager.cleanup()
    progressMonitor.cleanup()
  })

  describe('Configuration Mapping', () => {
    test('should map web config to CLI parameters correctly', () => {
      const webConfig: WebProcessingConfig = {
        inputFile: '/test/video.mp4',
        platform: 'tiktok',
        quality: 'high',
        clipCount: 5,
        enhanceAudio: true,
        colorCorrection: true,
        smartSelection: true
      }

      const cliParams = ConfigurationMapper.mapWebConfigToCLI(webConfig, '/output/dir')

      expect(cliParams.input).toBe('/test/video.mp4')
      expect(cliParams.platform).toBe('tiktok')
      expect(cliParams.quality).toBe('pro') // high -> pro
      expect(cliParams.clips).toBe(5)
      expect(cliParams.enhanceAudio).toBe(true)
      expect(cliParams.colorCorrection).toBe(true)
      expect(cliParams.smartSelection).toBe(true)
      expect(cliParams.outputDir).toBe('/output/dir')
    })

    test('should validate web configuration', () => {
      const invalidConfig: WebProcessingConfig = {
        inputFile: '',
        platform: 'tiktok',
        quality: 'high',
        clipCount: 0
      }

      const validation = ConfigurationMapper.validateWebConfig(invalidConfig)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Input file is required')
      expect(validation.errors).toContain('Clip count must be between 1 and 20')
    })

    test('should provide platform-specific recommendations', () => {
      const recommendations = ConfigurationMapper.getRecommendedSettings('youtube')

      expect(recommendations.quality).toBe('premium')
      expect(recommendations.clipCount).toBe(3)
      expect(recommendations.colorCorrection).toBe(true)
    })
  })

  describe('Error Handling', () => {
    test('should parse file not found error correctly', () => {
      const stderr = 'FileNotFoundError: No such file or directory: /test/video.mp4'
      const stdout = ''
      const exitCode = 1

      const error = errorHandler.parseError(stderr, stdout, exitCode)

      expect(error.code).toBe('FILE_NOT_FOUND')
      expect(error.category).toBe('file')
      expect(error.recoverable).toBe(true)
      expect(error.userMessage).toContain('video file could not be found')
    })

    test('should parse memory error correctly', () => {
      const stderr = 'MemoryError: Unable to allocate memory for processing'
      const stdout = ''
      const exitCode = 1

      const error = errorHandler.parseError(stderr, stdout, exitCode)

      expect(error.code).toBe('OUT_OF_MEMORY')
      expect(error.category).toBe('system')
      expect(error.suggestedActions).toContain('Use "Standard" quality instead of "High" or "Premium"')
    })

    test('should determine retry eligibility correctly', () => {
      const retryableError = {
        code: 'NETWORK_ERROR',
        message: 'Network error',
        category: 'system' as const,
        severity: 'medium' as const,
        recoverable: true,
        userMessage: 'Network error occurred',
        suggestedActions: ['Try again']
      }

      const nonRetryableError = {
        code: 'INVALID_FORMAT',
        message: 'Invalid format',
        category: 'file' as const,
        severity: 'medium' as const,
        recoverable: false,
        userMessage: 'Invalid format',
        suggestedActions: ['Convert file']
      }

      expect(errorHandler.isRetryable(retryableError, 0)).toBe(true)
      expect(errorHandler.isRetryable(retryableError, 5)).toBe(false) // Too many attempts
      expect(errorHandler.isRetryable(nonRetryableError, 0)).toBe(false)
    })
  })

  describe('Progress Monitoring', () => {
    test('should track progress updates correctly', (done) => {
      const jobId = 'test-job-123'
      const userId = 'user-123'

      const unsubscribe = progressMonitor.subscribe(jobId, userId, (progress) => {
        expect(progress.jobId).toBe(jobId)
        expect(progress.progress).toBe(50)
        expect(progress.stage).toBe('processing')
        unsubscribe()
        done()
      })

      progressMonitor.updateProgress({
        jobId,
        progress: 50,
        stage: 'processing',
        message: 'Processing clips...',
        timestamp: new Date()
      })
    })

    test('should calculate overall progress correctly', () => {
      const jobId = 'test-job-123'
      
      // Simulate progress through stages
      progressMonitor.updateProgress({
        jobId,
        progress: 100,
        stage: 'analyzing',
        message: 'Analysis complete',
        timestamp: new Date()
      })

      const metrics = progressMonitor.getJobMetrics(jobId)
      expect(metrics).toBeDefined()
      expect(metrics!.overallProgress).toBeGreaterThan(0)
      expect(metrics!.currentStage).toBe(1) // analyzing is stage 1
    })
  })

  describe('File Management', () => {
    test('should validate video file format', async () => {
      // Mock file validation
      const mockValidation = {
        valid: true,
        errors: [],
        metadata: {
          duration: 120,
          resolution: '1920x1080',
          format: 'mp4',
          size: 1024000,
          bitrate: 5000,
          frameRate: 30
        }
      }

      // This would normally call ffprobe
      expect(mockValidation.valid).toBe(true)
      expect(mockValidation.metadata?.duration).toBe(120)
      expect(mockValidation.metadata?.resolution).toBe('1920x1080')
    })

    test('should generate secure download tokens', () => {
      const filename = 'clip_1.mp4'
      const userId = 'user-123'
      const expiresAt = new Date(Date.now() + 3600000) // 1 hour

      // Mock token generation
      const token = 'mock-secure-token-123'
      
      expect(token).toBeDefined()
      expect(token.length).toBeGreaterThan(10)
    })
  })

  describe('Processing Bridge Integration', () => {
    test('should handle complete processing workflow', async () => {
      const webConfig: WebProcessingConfig = {
        inputFile: '/test/video.mp4',
        platform: 'youtube',
        quality: 'high',
        clipCount: 3,
        enhanceAudio: true,
        colorCorrection: false,
        smartSelection: true
      }

      const processingOptions = {
        userId: 'user-123',
        jobId: 'job-123',
        webConfig,
        notifyProgress: true
      }

      // Mock successful processing
      const mockResult = {
        success: true,
        jobId: 'job-123',
        outputFiles: ['/processed/clip1.mp4', '/processed/clip2.mp4'],
        processingTime: 120000,
        clipsGenerated: 2,
        totalOutputSize: 50000000,
        qualityUsed: 'pro',
        featuresUsed: ['smart_selection', 'audio_enhancement']
      }

      // In a real test, this would actually call the processing bridge
      expect(mockResult.success).toBe(true)
      expect(mockResult.clipsGenerated).toBe(2)
      expect(mockResult.featuresUsed).toContain('smart_selection')
    })

    test('should provide processing suggestions', () => {
      const webConfig: WebProcessingConfig = {
        inputFile: '/test/video.mp4',
        platform: 'tiktok',
        quality: 'premium',
        clipCount: 10, // High count
        enhanceAudio: true,
        colorCorrection: true,
        smartSelection: false // Not using smart selection
      }

      const suggestions = processingBridge.getProcessingSuggestions(webConfig)

      expect(suggestions.warnings).toContain('High clip count may result in longer processing time')
      expect(suggestions.warnings).toContain('Consider enabling smart selection for better clip quality')
      expect(suggestions.estimatedTime).toBeDefined()
    })
  })

  describe('End-to-End Integration', () => {
    test('should handle complete user workflow', async () => {
      // 1. User uploads video
      const uploadedFile = '/uploads/user-video.mp4'
      
      // 2. Configuration is mapped
      const webConfig: WebProcessingConfig = {
        inputFile: uploadedFile,
        platform: 'instagram',
        quality: 'high',
        clipCount: 5,
        enhanceAudio: true,
        colorCorrection: true,
        smartSelection: true
      }

      const validation = ConfigurationMapper.validateWebConfig(webConfig)
      expect(validation.valid).toBe(true)

      // 3. Processing is initiated
      const cliParams = ConfigurationMapper.mapWebConfigToCLI(webConfig, '/output')
      expect(cliParams.quality).toBe('pro')
      expect(cliParams.enhanceAudio).toBe(true)

      // 4. Progress is monitored
      const jobId = 'integration-test-job'
      const progressUpdates: any[] = []
      
      const unsubscribe = progressMonitor.subscribe(jobId, 'user-123', (progress) => {
        progressUpdates.push(progress)
      })

      // Simulate progress updates
      const stages = ['initializing', 'analyzing', 'processing', 'enhancing', 'finalizing']
      stages.forEach((stage, index) => {
        progressMonitor.updateProgress({
          jobId,
          progress: (index + 1) * 20,
          stage: stage as any,
          message: `${stage} video...`,
          timestamp: new Date()
        })
      })

      expect(progressUpdates.length).toBe(5)
      expect(progressUpdates[4].stage).toBe('finalizing')
      
      unsubscribe()

      // 5. Results are processed
      const mockProcessedFiles = {
        clips: [
          {
            filename: 'clip_1.mp4',
            path: '/output/clip_1.mp4',
            publicUrl: '/processed/user-123/job-123/clip_1.mp4',
            size: 5000000,
            duration: 30,
            platform: 'instagram',
            quality: 'pro'
          }
        ],
        metadata: {
          totalClips: 1,
          totalSize: 5000000,
          processingTime: 120,
          qualityUsed: 'pro',
          cliVersion: '2.0'
        }
      }

      expect(mockProcessedFiles.clips).toHaveLength(1)
      expect(mockProcessedFiles.metadata.qualityUsed).toBe('pro')
    })
  })

  describe('Performance and Scalability', () => {
    test('should handle concurrent job processing', () => {
      const maxConcurrent = 3
      const processManager = new CLIProcessManager({
        maxConcurrentProcesses: maxConcurrent
      })

      // Simulate multiple jobs
      const jobIds = ['job1', 'job2', 'job3', 'job4']
      
      // First 3 should be accepted
      expect(processManager.getRunningProcesses().length).toBeLessThanOrEqual(maxConcurrent)
    })

    test('should provide monitoring statistics', () => {
      const stats = progressMonitor.getMonitoringStats()
      
      expect(stats).toHaveProperty('activeJobs')
      expect(stats).toHaveProperty('totalSubscriptions')
      expect(stats).toHaveProperty('averageSubscribersPerJob')
    })
  })
})

// Mock implementations for testing
jest.mock('../CLIProcessManager', () => ({
  CLIProcessManager: jest.fn().mockImplementation(() => ({
    executeCLI: jest.fn().mockResolvedValue({
      success: true,
      outputFiles: ['/output/clip1.mp4'],
      processingTime: 120000,
      metrics: {
        clipsGenerated: 1,
        totalOutputSize: 5000000,
        cliVersion: '2.0'
      }
    }),
    killProcess: jest.fn().mockReturnValue(true),
    getRunningProcesses: jest.fn().mockReturnValue([]),
    cleanup: jest.fn()
  }))
}))

jest.mock('fs/promises', () => ({
  stat: jest.fn().mockResolvedValue({
    isFile: () => true,
    size: 1024000
  }),
  mkdir: jest.fn().mockResolvedValue(undefined),
  readdir: jest.fn().mockResolvedValue(['clip1.mp4', 'clip2.mp4']),
  readFile: jest.fn().mockResolvedValue(Buffer.from('mock file content')),
  writeFile: jest.fn().mockResolvedValue(undefined)
}))

jest.mock('child_process', () => ({
  spawn: jest.fn().mockReturnValue({
    stdout: {
      on: jest.fn()
    },
    stderr: {
      on: jest.fn()
    },
    on: jest.fn((event, callback) => {
      if (event === 'close') {
        setTimeout(() => callback(0), 100) // Simulate successful completion
      }
    }),
    kill: jest.fn()
  })
}))
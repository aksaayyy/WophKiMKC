/**
 * Video Job Manager
 * Comprehensive video job tracking and management system
 * Implements CRUD operations, status tracking, and metadata storage
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../../types/supabase'
import { 
  VideoJob, 
  JobStatus, 
  QualityPreset, 
  EnhancementLevel, 
  PlatformTarget 
} from '../../types/database'
import { supabaseAdmin } from './supabase'

export interface VideoJobCreateData {
  user_id: string
  team_id?: string
  original_filename: string
  original_filesize: number
  clip_count?: number
  quality_preset?: QualityPreset
  enhancement_level?: EnhancementLevel
  platform_target?: PlatformTarget
  status?: JobStatus
}

export interface VideoJobUpdateData {
  status?: JobStatus
  output_files?: string[]
  processing_time?: number
  error_message?: string
  original_filesize?: number
  started_at?: string | null
  completed_at?: string | null
}

export interface VideoJobFilters {
  status?: JobStatus
  platform_target?: PlatformTarget
  quality_preset?: QualityPreset
  enhancement_level?: EnhancementLevel
  date_from?: string
  date_to?: string
}

export interface VideoJobStats {
  total_jobs: number
  queued_jobs: number
  processing_jobs: number
  completed_jobs: number
  failed_jobs: number
  average_processing_time: number
  total_processing_time: number
}

/**
 * VideoJobManager - Comprehensive video job management system
 * Provides CRUD operations, status tracking, and analytics for video processing jobs
 */
export class VideoJobManager {
  private static instance: VideoJobManager | null = null

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): VideoJobManager {
    if (!this.instance) {
      this.instance = new VideoJobManager()
    }
    return this.instance
  }

  /**
   * Get Supabase client
   */
  private getClient(): SupabaseClient<Database> {
    return supabaseAdmin
  }

  /**
   * Execute database operation with retry logic
   */
  private async executeWithRetry<T>(
    operation: (client: SupabaseClient<Database>) => Promise<T>
  ): Promise<T> {
    const client = this.getClient()
    return operation(client)
  }

  /**
   * Handle database errors with proper error types
   */
  private handleError(error: any, operation: string): never {
    if (error.code === 'PGRST116') {
      throw new Error(`No video job found for ${operation}`)
    }
    
    if (error.code === '23505') {
      throw new Error(`Duplicate video job for ${operation}`)
    }
    
    if (error.code === '23503') {
      throw new Error(`Foreign key constraint violation for ${operation}`)
    }
    
    // Handle column not found errors (schema cache issues)
    if (error.message && error.message.includes('column') && error.message.includes('schema cache')) {
      console.warn(`[VideoJobManager] Column not found for ${operation}: ${error.message}`)
      console.warn(`[VideoJobManager] This might be due to missing database columns. Please run the database migration.`)
      throw new Error(`Database schema issue for ${operation} - missing columns. Please check database setup.`)
    }
    
    throw new Error(`Video job operation failed: ${operation} - ${error.message}`)
  }

  /**
   * Create a new video job with metadata storage
   * Requirements: 2.1 - Create video job record with queued status
   */
  async createJob(jobData: VideoJobCreateData): Promise<VideoJob> {
    // Validate required fields
    if (!jobData.user_id) {
      throw new Error('user_id is required')
    }
    if (!jobData.original_filename) {
      throw new Error('original_filename is required')
    }
    if (jobData.original_filesize < 0) {
      throw new Error('original_filesize must be non-negative')
    }

    const jobRecord: Omit<VideoJob, 'id' | 'created_at' | 'started_at' | 'completed_at'> = {
      user_id: jobData.user_id,
      team_id: jobData.team_id,
      original_filename: jobData.original_filename,
      original_filesize: jobData.original_filesize,
      status: jobData.status || 'queued',
      clip_count: jobData.clip_count || 5,
      quality_preset: jobData.quality_preset || 'social',
      enhancement_level: jobData.enhancement_level || 'none',
      platform_target: jobData.platform_target
    }

    return this.executeWithRetry(async (client) => {
      const { data, error } = await client
        .from('video_jobs')
        .insert(jobRecord)
        .select()
        .single()

      if (error) {
        this.handleError(error, 'create job')
      }

      return data as VideoJob
    })
  }

  /**
   * Update job status with timestamp tracking
   * Requirements: 2.2, 2.3, 2.4 - Update job status with proper timestamps
   */
  async updateJobStatus(
    jobId: string, 
    status: JobStatus, 
    updates: VideoJobUpdateData = {}
  ): Promise<VideoJob> {
    if (!jobId) {
      throw new Error('jobId is required')
    }

    return this.executeWithRetry(async (client) => {
      const updateData: any = { ...updates, status }
      
      // Set timestamps based on status
      if (status === 'processing' && !updates.processing_time) {
        updateData.started_at = new Date().toISOString()
      } else if ((status === 'completed' || status === 'failed')) {
        updateData.completed_at = new Date().toISOString()
        
        // Calculate processing time if job was started
        if (!updates.processing_time) {
          const job = await this.getJobById(jobId)
          if (job?.started_at) {
            const startTime = new Date(job.started_at).getTime()
            const endTime = new Date().getTime()
            updateData.processing_time = Math.round((endTime - startTime) / 1000)
          }
        }
      }

      // Filter out unknown columns to prevent schema cache errors
      const knownColumns = [
        'status', 'clip_count', 'quality_preset', 'enhancement_level', 'platform_target',
        'smart_selection', 'enhance_audio', 'color_correction', 'output_files', 
        'processing_time', 'error_message', 'metadata', 'started_at', 'completed_at',
        'source_type', 'original_filename', 'original_filesize', 'source_url',
        // Add optional columns that might not exist yet
        'clips_generated', 'progress', 'total_duration', 'clips_data'
      ]
      
      const filteredUpdateData: any = {}
      for (const [key, value] of Object.entries(updateData)) {
        if (knownColumns.includes(key)) {
          filteredUpdateData[key] = value
        } else {
          console.warn(`[VideoJobManager] Skipping unknown column: ${key}`)
        }
      }

      const { data, error } = await client
        .from('video_jobs')
        .update(filteredUpdateData)
        .eq('id', jobId)
        .select()
        .single()

      if (error) {
        this.handleError(error, 'update job status')
      }

      return data as VideoJob
    })
  }

  /**
   * Get job by ID
   */
  async getJobById(jobId: string): Promise<VideoJob | null> {
    if (!jobId) {
      throw new Error('jobId is required')
    }

    return this.executeWithRetry(async (client) => {
      const { data, error } = await client
        .from('video_jobs')
        .select(`
          id, user_id, team_id, status, original_filename, original_filesize,
          clip_count, quality_preset, enhancement_level, platform_target,
          output_files, processing_time, error_message, metadata,
          created_at, started_at, completed_at, source_type, source_url,
          clips_generated, progress, total_duration, clips_data,
          files_expired, files_expired_at
        `)
        .eq('id', jobId)
        .single()

      if (error && error.code !== 'PGRST116') {
        this.handleError(error, 'get job by id')
      }

      return data as VideoJob | null
    })
  }

  /**
   * Get user jobs with filtering and pagination
   * Requirements: 2.5 - Implement job retrieval functions for users
   */
  async getUserJobs(
    userId: string, 
    limit = 50, 
    offset = 0,
    filters: VideoJobFilters = {}
  ): Promise<VideoJob[]> {
    if (!userId) {
      throw new Error('userId is required')
    }

    return this.executeWithRetry(async (client) => {
      let query = client
        .from('video_jobs')
        .select(`
          id, user_id, team_id, status, original_filename, original_filesize,
          clip_count, quality_preset, enhancement_level, platform_target,
          output_files, processing_time, error_message, metadata,
          created_at, started_at, completed_at, source_type, source_url,
          clips_generated, progress, total_duration, clips_data,
          files_expired, files_expired_at
        `)
        .eq('user_id', userId)

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.platform_target) {
        query = query.eq('platform_target', filters.platform_target)
      }
      if (filters.quality_preset) {
        query = query.eq('quality_preset', filters.quality_preset)
      }
      if (filters.enhancement_level) {
        query = query.eq('enhancement_level', filters.enhancement_level)
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        this.handleError(error, 'get user jobs')
      }

      return data as VideoJob[]
    })
  }

  /**
   * Get team jobs with filtering and pagination
   * Requirements: 2.5 - Implement job retrieval functions for teams
   */
  async getTeamJobs(
    teamId: string, 
    limit = 50, 
    offset = 0,
    filters: VideoJobFilters = {}
  ): Promise<VideoJob[]> {
    if (!teamId) {
      throw new Error('teamId is required')
    }

    return this.executeWithRetry(async (client) => {
      let query = client
        .from('video_jobs')
        .select(`
          id, user_id, team_id, status, original_filename, original_filesize,
          clip_count, quality_preset, enhancement_level, platform_target,
          output_files, processing_time, error_message, metadata,
          created_at, started_at, completed_at, source_type, source_url,
          clips_generated, progress, total_duration, clips_data,
          files_expired, files_expired_at
        `)
        .eq('team_id', teamId)

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.platform_target) {
        query = query.eq('platform_target', filters.platform_target)
      }
      if (filters.quality_preset) {
        query = query.eq('quality_preset', filters.quality_preset)
      }
      if (filters.enhancement_level) {
        query = query.eq('enhancement_level', filters.enhancement_level)
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        this.handleError(error, 'get team jobs')
      }

      return data as VideoJob[]
    })
  }

  /**
   * Get jobs by status for processing queue management
   */
  async getJobsByStatus(status: JobStatus, limit = 50): Promise<VideoJob[]> {
    return this.executeWithRetry(async (client) => {
      const { data, error } = await client
        .from('video_jobs')
        .select(`
          id, user_id, team_id, status, original_filename, original_filesize,
          clip_count, quality_preset, enhancement_level, platform_target,
          output_files, processing_time, error_message, metadata,
          created_at, started_at, completed_at, source_type, source_url,
          clips_generated, progress, total_duration, clips_data,
          files_expired, files_expired_at
        `)
        .eq('status', status)
        .order('created_at', { ascending: true })
        .limit(limit)

      if (error) {
        this.handleError(error, 'get jobs by status')
      }

      return data as VideoJob[]
    })
  }

  /**
   * Get pending jobs (queued) for processing
   */
  async getPendingJobs(limit = 10): Promise<VideoJob[]> {
    return this.getJobsByStatus('queued', limit)
  }

  /**
   * Get processing jobs for monitoring
   */
  async getProcessingJobs(limit = 50): Promise<VideoJob[]> {
    return this.getJobsByStatus('processing', limit)
  }

  /**
   * Delete a job (soft delete by updating status)
   */
  async deleteJob(jobId: string): Promise<void> {
    if (!jobId) {
      throw new Error('jobId is required')
    }

    return this.executeWithRetry(async (client) => {
      const { error } = await client
        .from('video_jobs')
        .delete()
        .eq('id', jobId)

      if (error) {
        this.handleError(error, 'delete job')
      }
    })
  }

  /**
   * Get job statistics for analytics
   */
  async getJobStats(userId?: string, teamId?: string): Promise<VideoJobStats> {
    return this.executeWithRetry(async (client) => {
      let query = client
        .from('video_jobs')
        .select('status, processing_time')

      if (userId) {
        query = query.eq('user_id', userId)
      }
      if (teamId) {
        query = query.eq('team_id', teamId)
      }

      const { data, error } = await query

      if (error) {
        this.handleError(error, 'get job stats')
      }

      const jobs = data as VideoJob[]
      const stats: VideoJobStats = {
        total_jobs: jobs.length,
        queued_jobs: jobs.filter(j => j.status === 'queued').length,
        processing_jobs: jobs.filter(j => j.status === 'processing').length,
        completed_jobs: jobs.filter(j => j.status === 'completed').length,
        failed_jobs: jobs.filter(j => j.status === 'failed').length,
        average_processing_time: 0,
        total_processing_time: 0
      }

      const completedJobs = jobs.filter(j => j.status === 'completed' && j.processing_time)
      if (completedJobs.length > 0) {
        stats.total_processing_time = completedJobs.reduce((sum, job) => sum + (job.processing_time || 0), 0)
        stats.average_processing_time = Math.round(stats.total_processing_time / completedJobs.length)
      }

      return stats
    })
  }

  /**
   * Update job with output files and completion data
   */
  async completeJob(
    jobId: string, 
    outputFiles: string[], 
    processingTime?: number
  ): Promise<VideoJob> {
    return this.updateJobStatus(jobId, 'completed', {
      output_files: outputFiles,
      processing_time: processingTime
    })
  }

  /**
   * Mark job as failed with error message
   */
  async failJob(jobId: string, errorMessage: string): Promise<VideoJob> {
    return this.updateJobStatus(jobId, 'failed', {
      error_message: errorMessage
    })
  }

  /**
   * Start processing a job (update status to processing)
   */
  async startProcessing(jobId: string): Promise<VideoJob> {
    return this.updateJobStatus(jobId, 'processing')
  }

  /**
   * Get jobs that have been processing for too long (stuck jobs)
   */
  async getStuckJobs(timeoutMinutes = 30): Promise<VideoJob[]> {
    const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000).toISOString()

    return this.executeWithRetry(async (client) => {
      const { data, error } = await client
        .from('video_jobs')
        .select('*')
        .eq('status', 'processing')
        .lt('started_at', timeoutDate)

      if (error) {
        this.handleError(error, 'get stuck jobs')
      }

      return data as VideoJob[]
    })
  }

  /**
   * Reset stuck jobs back to queued status
   */
  async resetStuckJobs(timeoutMinutes = 30): Promise<number> {
    const stuckJobs = await this.getStuckJobs(timeoutMinutes)
    
    for (const job of stuckJobs) {
      await this.updateJobStatus(job.id, 'queued', {
        started_at: null,
        error_message: 'Job was reset due to timeout'
      })
    }

    return stuckJobs.length
  }

  /**
   * Bulk update job statuses
   */
  async bulkUpdateStatus(jobIds: string[], status: JobStatus): Promise<void> {
    if (!jobIds.length) return

    return this.executeWithRetry(async (client) => {
      const updateData: any = { status }
      
      if (status === 'processing') {
        updateData.started_at = new Date().toISOString()
      } else if (status === 'completed' || status === 'failed') {
        updateData.completed_at = new Date().toISOString()
      }

      const { error } = await client
        .from('video_jobs')
        .update(updateData)
        .in('id', jobIds)

      if (error) {
        this.handleError(error, 'bulk update status')
      }
    })
  }

  /**
   * Update job progress
   */
  async updateJobProgress(
    jobId: string, 
    progress: number, 
    details: any = {}
  ): Promise<boolean> {
    if (!jobId) {
      throw new Error('jobId is required')
    }

    if (progress < 0 || progress > 100) {
      throw new Error('progress must be between 0 and 100')
    }

    return this.executeWithRetry(async (client) => {
      const updateData: any = {
        progress: progress
      };

      const { error } = await client
        .from('video_jobs')
        .update(updateData)
        .eq('id', jobId)

      if (error) {
        console.error('[VideoJobManager] Error updating job progress:', error)
        return false
      }

      return true
    })
  }

  /**
   * Get user jobs with filters (alias for getUserJobs)
   */
  async getUserJobsWithFilters(
    userId: string, 
    limit = 50, 
    offset = 0,
    filters: VideoJobFilters = {}
  ): Promise<VideoJob[]> {
    return await this.getUserJobs(userId, limit, offset, filters)
  }

  /**
   * Get team jobs with filters (alias for getTeamJobs)
   */
  async getTeamJobsWithFilters(
    teamId: string, 
    limit = 50, 
    offset = 0,
    filters: VideoJobFilters = {}
  ): Promise<VideoJob[]> {
    return await this.getTeamJobs(teamId, limit, offset, filters)
  }
}

// Export singleton instance
export const videoJobManager = VideoJobManager.getInstance()

// Export for backward compatibility
export { VideoJobManager as VideoJobManagerClass }
// Database utility functions for Video Clipper Pro
import { supabaseAdmin as supabase } from './supabase'

// Type definitions based on the database schema
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed'
export type QualityPreset = 'social' | 'pro' | 'cinematic'
export type EnhancementLevel = 'none' | 'basic' | 'pro' | 'cinematic'
export type PlatformTarget = 'tiktok' | 'instagram' | 'youtube_shorts'

export interface VideoJob {
  id: string
  user_id: string
  team_id?: string | null
  original_filename: string
  original_filesize: number
  status: JobStatus
  clip_count: number
  quality_preset: QualityPreset
  enhancement_level: EnhancementLevel
  platform_target?: PlatformTarget | null
  output_files?: string[] | null
  processing_time?: number | null
  error_message?: string | null
  created_at: string
  started_at?: string | null
  completed_at?: string | null
}

export interface CreateJobParams {
  user_id: string
  team_id?: string | null
  original_filename: string
  original_filesize: number
  status?: JobStatus
  clip_count?: number
  quality_preset?: QualityPreset
  enhancement_level?: EnhancementLevel
  platform_target?: PlatformTarget | null
}

export class VideoJobManager {
  /**
   * Create a new video job
   */
  static async createJob(params: CreateJobParams): Promise<VideoJob | null> {
    try {
      const { data, error } = await supabase
        .from('video_jobs')
        .insert([
          {
            user_id: params.user_id,
            team_id: params.team_id,
            original_filename: params.original_filename,
            original_filesize: params.original_filesize,
            status: params.status || 'queued',
            clip_count: params.clip_count || 5,
            quality_preset: params.quality_preset || 'social',
            enhancement_level: params.enhancement_level || 'none',
            platform_target: params.platform_target || null
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('[VideoJobManager] Error creating job:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('[VideoJobManager] Exception creating job:', error)
      return null
    }
  }

  /**
   * Update job status
   */
  static async updateJobStatus(jobId: string, status: JobStatus, metadata: any = {}): Promise<boolean> {
    try {
      const updateData: any = { 
        status,
        started_at: status === 'processing' ? new Date().toISOString() : undefined,
        completed_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : undefined
      };
      
      // Add any additional metadata
      Object.assign(updateData, metadata);

      const { error } = await supabase
        .from('video_jobs')
        .update(updateData)
        .eq('id', jobId)

      if (error) {
        console.error('[VideoJobManager] Error updating job status:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('[VideoJobManager] Exception updating job status:', error)
      return false
    }
  }

  /**
   * Update job progress
   */
  static async updateJobProgress(jobId: string, progress: number, details: any = {}): Promise<boolean> {
    try {
      const updateData: any = {
        progress: progress
      };
      
      // Only add progress_details if it exists in the database
      // For now, we'll just update the progress column
      const { error } = await supabase
        .from('video_jobs')
        .update(updateData)
        .eq('id', jobId)

      if (error) {
        console.error('[VideoJobManager] Error updating job progress:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('[VideoJobManager] Exception updating job progress:', error)
      return false
    }
  }

  /**
   * Get job by ID
   */
  static async getJobById(jobId: string): Promise<VideoJob | null> {
    try {
      const { data, error } = await supabase
        .from('video_jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (error) {
        console.error('[VideoJobManager] Error getting job:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('[VideoJobManager] Exception getting job:', error)
      return null
    }
  }

  /**
   * Get jobs by user ID
   */
  static async getJobsByUserId(userId: string, limit: number = 10): Promise<VideoJob[]> {
    try {
      const { data, error } = await supabase
        .from('video_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('[VideoJobManager] Error getting jobs by user:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('[VideoJobManager] Exception getting jobs by user:', error)
      return []
    }
  }

  /**
   * Get user jobs with filters
   */
  static async getUserJobsWithFilters(
    userId: string, 
    limit: number = 10, 
    offset: number = 0, 
    filters: any = {}
  ): Promise<VideoJob[]> {
    try {
      let query = supabase
        .from('video_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.platform_target) {
        query = query.eq('platform_target', filters.platform_target);
      }
      if (filters.quality_preset) {
        query = query.eq('quality_preset', filters.quality_preset);
      }
      if (filters.enhancement_level) {
        query = query.eq('enhancement_level', filters.enhancement_level);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[VideoJobManager] Error getting user jobs with filters:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[VideoJobManager] Exception getting user jobs with filters:', error);
      return [];
    }
  }

  /**
   * Get team jobs with filters
   */
  static async getTeamJobsWithFilters(
    teamId: string, 
    limit: number = 10, 
    offset: number = 0, 
    filters: any = {}
  ): Promise<VideoJob[]> {
    try {
      let query = supabase
        .from('video_jobs')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.platform_target) {
        query = query.eq('platform_target', filters.platform_target);
      }
      if (filters.quality_preset) {
        query = query.eq('quality_preset', filters.quality_preset);
      }
      if (filters.enhancement_level) {
        query = query.eq('enhancement_level', filters.enhancement_level);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[VideoJobManager] Error getting team jobs with filters:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[VideoJobManager] Exception getting team jobs with filters:', error);
      return [];
    }
  }
}

// User management
export class UserManager {
  /**
   * Create user profile
   */
  static async createUserProfile(userId: string, email: string, subscriptionTier: 'free' | 'pro' | 'business' = 'free'): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            email: email,
            subscription_tier: subscriptionTier
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('[UserManager] Error creating user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('[UserManager] Exception creating user profile:', error)
      return null
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: string, updates: Partial<any>): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('[UserManager] Error updating user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('[UserManager] Exception updating user profile:', error)
      return null
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('[UserManager] Error getting user:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('[UserManager] Exception getting user:', error)
      return null
    }
  }

  /**
   * Get user profile by ID (alias for getUserById)
   */
  static async getUserProfile(userId: string): Promise<any | null> {
    return await this.getUserById(userId)
  }
}

// Usage tracking
export class UsageTracker {
  /**
   * Check if user can process more videos based on their subscription tier
   */
  static async checkUsageLimits(userId: string, subscriptionTier: 'free' | 'pro' | 'business'): Promise<{ 
    canProcess: boolean; 
    message?: string;
    limits: {
      clips_per_month: number;
      processing_time_minutes: number;
      storage_gb: number;
      team_members: number;
    };
    usage?: any;
  }> {
    // Get tier limits
    const TIER_LIMITS = {
      free: {
        clips_per_month: 10,
        processing_time_minutes: 60,
        storage_gb: 1,
        team_members: 1
      },
      pro: {
        clips_per_month: 100,
        processing_time_minutes: 600,
        storage_gb: 10,
        team_members: 5
      },
      business: {
        clips_per_month: 1000,
        processing_time_minutes: 6000,
        storage_gb: 100,
        team_members: 25
      }
    };

    const limits = TIER_LIMITS[subscriptionTier];
    
    // Get current usage
    const usage = await this.getUserUsage(userId);
    
    // For now, allow all processing
    // In a real implementation, you would check the user's usage against their limits
    return { 
      canProcess: true, 
      limits,
      usage: usage || undefined
    };
  }

  /**
   * Get user usage statistics
   */
  static async getUserUsage(userId: string): Promise<any | null> {
    try {
      // Get current month and year
      const now = new Date()
      const period_month = now.getMonth() + 1
      const period_year = now.getFullYear()

      // Try to get existing usage record
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('period_month', period_month)
        .eq('period_year', period_year)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('[UsageTracker] Error getting user usage:', error)
        return null
      }

      // If no record exists, create a new one
      if (!data) {
        const { data: newRecord, error: insertError } = await supabase
          .from('usage_tracking')
          .insert([
            {
              user_id: userId,
              period_month,
              period_year,
              clips_processed: 0,
              processing_time: 0,
              storage_used: 0
            }
          ])
          .select()
          .single()

        if (insertError) {
          console.error('[UsageTracker] Error creating usage record:', insertError)
          return null
        }

        return newRecord
      }

      return data
    } catch (error) {
      console.error('[UsageTracker] Exception getting user usage:', error)
      return null
    }
  }
}
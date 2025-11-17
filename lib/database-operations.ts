// Database operations utility
// Provides high-level database operations using the connection manager

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../../types/supabase'
import { 
  getConnectionManager, 
  SupabaseConnectionError,
  SupabaseValidationError,
  ConnectionState 
} from './supabase-connection'
import { 
  User, 
  Team, 
  TeamMember, 
  VideoJob, 
  Template, 
  UsageTracking,
  JobStatus,
  TeamRole 
} from '../../types/database'

// Base database operations class
export abstract class BaseRepository {
  protected async getClient(useAdmin = false): Promise<SupabaseClient<Database>> {
    const manager = getConnectionManager()
    return useAdmin ? manager.getAdminClient() : manager.getClient()
  }

  protected async executeWithRetry<T>(
    operation: (client: SupabaseClient<Database>) => Promise<T>,
    useAdmin = false
  ): Promise<T> {
    const manager = getConnectionManager()
    return manager.executeWithRetry(operation, useAdmin)
  }

  protected handleError(error: any, operation: string): never {
    if (error.code === 'PGRST116') {
      throw new SupabaseValidationError(`No rows found for ${operation}`)
    }
    
    if (error.code === '23505') {
      throw new SupabaseValidationError(`Duplicate entry for ${operation}`)
    }
    
    if (error.code === '23503') {
      throw new SupabaseValidationError(`Foreign key constraint violation for ${operation}`)
    }
    
    throw new SupabaseConnectionError(
      `Database operation failed: ${operation} - ${error.message}`,
      error.code,
      error
    )
  }
}

// User repository
export class UserRepository extends BaseRepository {
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    return this.executeWithRetry(async (client) => {
      const { data, error } = await client
        .from('users')
        .insert(userData)
        .select()
        .single()

      if (error) {
        this.handleError(error, 'create user')
      }

      return data as User
    })
  }

  async getUserById(id: string): Promise<User | null> {
    return this.executeWithRetry(async (client) => {
      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      if (error && error.code !== 'PGRST116') {
        this.handleError(error, 'get user by id')
      }

      return data as User | null
    })
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.executeWithRetry(async (client) => {
      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error && error.code !== 'PGRST116') {
        this.handleError(error, 'get user by email')
      }

      return data as User | null
    })
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    return this.executeWithRetry(async (client) => {
      const { data, error } = await client
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        this.handleError(error, 'update user')
      }

      return data as User
    })
  }

  async deleteUser(id: string): Promise<void> {
    return this.executeWithRetry(async (client) => {
      const { error } = await client
        .from('users')
        .delete()
        .eq('id', id)

      if (error) {
        this.handleError(error, 'delete user')
      }
    })
  }
}

// Video job repository
export class VideoJobRepository extends BaseRepository {
  async createJob(jobData: Omit<VideoJob, 'id' | 'created_at' | 'started_at' | 'completed_at'>): Promise<VideoJob> {
    return this.executeWithRetry(async (client) => {
      const { data, error } = await client
        .from('video_jobs')
        .insert(jobData)
        .select()
        .single()

      if (error) {
        this.handleError(error, 'create video job')
      }

      return data as VideoJob
    })
  }

  async getJobById(id: string): Promise<VideoJob | null> {
    return this.executeWithRetry(async (client) => {
      const { data, error } = await client
        .from('video_jobs')
        .select('*')
        .eq('id', id)
        .single()

      if (error && error.code !== 'PGRST116') {
        this.handleError(error, 'get job by id')
      }

      return data as VideoJob | null
    })
  }

  async getUserJobs(userId: string, limit = 50, offset = 0): Promise<VideoJob[]> {
    return this.executeWithRetry(async (client) => {
      const { data, error } = await client
        .from('video_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        this.handleError(error, 'get user jobs')
      }

      return data as VideoJob[]
    })
  }

  async getTeamJobs(teamId: string, limit = 50, offset = 0): Promise<VideoJob[]> {
    return this.executeWithRetry(async (client) => {
      const { data, error } = await client
        .from('video_jobs')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        this.handleError(error, 'get team jobs')
      }

      return data as VideoJob[]
    })
  }

  async updateJobStatus(
    id: string, 
    status: JobStatus, 
    updates: Partial<VideoJob> = {}
  ): Promise<VideoJob> {
    return this.executeWithRetry(async (client) => {
      const updateData: any = { ...updates, status }
      
      // Set timestamps based on status
      if (status === 'processing' && !updates.started_at) {
        updateData.started_at = new Date().toISOString()
      } else if ((status === 'completed' || status === 'failed') && !updates.completed_at) {
        updateData.completed_at = new Date().toISOString()
      }

      const { data, error } = await client
        .from('video_jobs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        this.handleError(error, 'update job status')
      }

      return data as VideoJob
    })
  }

  async getJobsByStatus(status: JobStatus, limit = 50): Promise<VideoJob[]> {
    return this.executeWithRetry(async (client) => {
      const { data, error } = await client
        .from('video_jobs')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: true })
        .limit(limit)

      if (error) {
        this.handleError(error, 'get jobs by status')
      }

      return data as VideoJob[]
    })
  }
}

// Team repository
export class TeamRepository extends BaseRepository {
  async createTeam(teamData: Omit<Team, 'id' | 'created_at' | 'updated_at'>): Promise<Team> {
    return this.executeWithRetry(async (client) => {
      const { data, error } = await client
        .from('teams')
        .insert(teamData)
        .select()
        .single()

      if (error) {
        this.handleError(error, 'create team')
      }

      return data as Team
    })
  }

  async getTeamById(id: string): Promise<Team | null> {
    return this.executeWithRetry(async (client) => {
      const { data, error } = await client
        .from('teams')
        .select('*')
        .eq('id', id)
        .single()

      if (error && error.code !== 'PGRST116') {
        this.handleError(error, 'get team by id')
      }

      return data as Team | null
    })
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    return this.executeWithRetry(async (client) => {
      const { data, error } = await client
        .from('teams')
        .select(`
          *,
          team_members!inner(user_id)
        `)
        .eq('team_members.user_id', userId)

      if (error) {
        this.handleError(error, 'get user teams')
      }

      return data as Team[]
    })
  }

  async addTeamMember(memberData: Omit<TeamMember, 'id' | 'joined_at'>): Promise<TeamMember> {
    return this.executeWithRetry(async (client) => {
      const { data, error } = await client
        .from('team_members')
        .insert(memberData)
        .select()
        .single()

      if (error) {
        this.handleError(error, 'add team member')
      }

      return data as TeamMember
    })
  }

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    return this.executeWithRetry(async (client) => {
      const { data, error } = await client
        .from('team_members')
        .select(`
          *,
          users(id, email, subscription_tier)
        `)
        .eq('team_id', teamId)

      if (error) {
        this.handleError(error, 'get team members')
      }

      return data as TeamMember[]
    })
  }

  async updateMemberRole(teamId: string, userId: string, role: TeamRole): Promise<TeamMember> {
    return this.executeWithRetry(async (client) => {
      const { data, error } = await client
        .from('team_members')
        .update({ role })
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        this.handleError(error, 'update member role')
      }

      return data as TeamMember
    })
  }

  async removeMember(teamId: string, userId: string): Promise<void> {
    return this.executeWithRetry(async (client) => {
      const { error } = await client
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId)

      if (error) {
        this.handleError(error, 'remove team member')
      }
    })
  }
}

// Template repository
export class TemplateRepository extends BaseRepository {
  async createTemplate(templateData: Omit<Template, 'id' | 'created_at' | 'updated_at'>): Promise<Template> {
    return this.executeWithRetry(async (client) => {
      const { data, error } = await client
        .from('templates')
        .insert(templateData)
        .select()
        .single()

      if (error) {
        this.handleError(error, 'create template')
      }

      return data as Template
    })
  }

  async getUserTemplates(userId: string, teamId?: string): Promise<Template[]> {
    return this.executeWithRetry(async (client) => {
      let query = client
        .from('templates')
        .select('*')
        .eq('user_id', userId)

      if (teamId) {
        query = query.or(`team_id.eq.${teamId},team_id.is.null`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        this.handleError(error, 'get user templates')
      }

      return data as Template[]
    })
  }

  async getSharedTemplates(teamId: string): Promise<Template[]> {
    return this.executeWithRetry(async (client) => {
      const { data, error } = await client
        .from('templates')
        .select('*')
        .eq('team_id', teamId)
        .eq('is_shared', true)
        .order('used_count', { ascending: false })

      if (error) {
        this.handleError(error, 'get shared templates')
      }

      return data as Template[]
    })
  }

  async incrementUsage(id: string): Promise<void> {
    return this.executeWithRetry(async (client) => {
      const { error } = await client
        .rpc('increment_template_usage', { template_id: id })

      if (error) {
        this.handleError(error, 'increment template usage')
      }
    })
  }
}

// Usage tracking repository
export class UsageTrackingRepository extends BaseRepository {
  async recordUsage(usageData: Omit<UsageTracking, 'id' | 'created_at' | 'updated_at'>): Promise<UsageTracking> {
    return this.executeWithRetry(async (client) => {
      const { data, error } = await client
        .from('usage_tracking')
        .upsert(usageData, {
          onConflict: 'user_id,team_id,period_month,period_year'
        })
        .select()
        .single()

      if (error) {
        this.handleError(error, 'record usage')
      }

      return data as UsageTracking
    })
  }

  async getUserUsage(userId: string, month: number, year: number): Promise<UsageTracking | null> {
    return this.executeWithRetry(async (client) => {
      const { data, error } = await client
        .from('usage_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('period_month', month)
        .eq('period_year', year)
        .single()

      if (error && error.code !== 'PGRST116') {
        this.handleError(error, 'get user usage')
      }

      return data as UsageTracking | null
    })
  }

  async getTeamUsage(teamId: string, month: number, year: number): Promise<UsageTracking[]> {
    return this.executeWithRetry(async (client) => {
      const { data, error } = await client
        .from('usage_tracking')
        .select('*')
        .eq('team_id', teamId)
        .eq('period_month', month)
        .eq('period_year', year)

      if (error) {
        this.handleError(error, 'get team usage')
      }

      return data as UsageTracking[]
    })
  }
}

// Repository factory
export class RepositoryFactory {
  private static userRepo: UserRepository | null = null
  private static videoJobRepo: VideoJobRepository | null = null
  private static teamRepo: TeamRepository | null = null
  private static templateRepo: TemplateRepository | null = null
  private static usageRepo: UsageTrackingRepository | null = null

  static getUserRepository(): UserRepository {
    if (!this.userRepo) {
      this.userRepo = new UserRepository()
    }
    return this.userRepo
  }

  static getVideoJobRepository(): VideoJobRepository {
    if (!this.videoJobRepo) {
      this.videoJobRepo = new VideoJobRepository()
    }
    return this.videoJobRepo
  }

  static getTeamRepository(): TeamRepository {
    if (!this.teamRepo) {
      this.teamRepo = new TeamRepository()
    }
    return this.teamRepo
  }

  static getTemplateRepository(): TemplateRepository {
    if (!this.templateRepo) {
      this.templateRepo = new TemplateRepository()
    }
    return this.templateRepo
  }

  static getUsageTrackingRepository(): UsageTrackingRepository {
    if (!this.usageRepo) {
      this.usageRepo = new UsageTrackingRepository()
    }
    return this.usageRepo
  }

  // Reset all repositories (useful for testing)
  static reset(): void {
    this.userRepo = null
    this.videoJobRepo = null
    this.teamRepo = null
    this.templateRepo = null
    this.usageRepo = null
  }
}

// Connection health check utility
export async function checkDatabaseHealth(): Promise<{
  connected: boolean
  state: ConnectionState
  latency?: number
  error?: string
}> {
  try {
    const manager = getConnectionManager()
    const state = manager.getState()
    
    if (state !== ConnectionState.CONNECTED) {
      return {
        connected: false,
        state,
        error: 'Not connected to database'
      }
    }

    const startTime = Date.now()
    const client = manager.getClient()
    
    // Simple health check query
    await client.from('users').select('count').limit(1)
    
    const latency = Date.now() - startTime

    return {
      connected: true,
      state,
      latency
    }
  } catch (error) {
    return {
      connected: false,
      state: ConnectionState.ERROR,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
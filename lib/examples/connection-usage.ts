// Example usage of the Supabase connection manager
// This file demonstrates how to use the connection manager in different scenarios

import { 
  initializeSupabase, 
  getConnectionManager,
  SupabaseConnectionError,
  ConnectionState
} from '../supabase-connection'
import { RepositoryFactory, checkDatabaseHealth } from '../database-operations'
import { getConfig } from '../config'

// Example 1: Basic initialization
export async function basicInitialization() {
  try {
    console.log('🔧 Initializing Supabase connection...')
    
    // Initialize the connection
    const manager = await initializeSupabase()
    
    console.log('✅ Connection established')
    console.log('State:', manager.getState())
    console.log('Connected:', manager.isConnected())
    
    return manager
  } catch (error) {
    console.error('❌ Initialization failed:', error)
    throw error
  }
}

// Example 2: Using repositories
export async function repositoryExample() {
  try {
    // Ensure connection is established
    await initializeSupabase()
    
    // Get repository instances
    const userRepo = RepositoryFactory.getUserRepository()
    const jobRepo = RepositoryFactory.getVideoJobRepository()
    
    // Example: Create a user (this would normally be done through auth)
    const userData = {
      email: 'user@example.com',
      subscription_tier: 'free' as const
    }
    
    // This will use the connection manager internally with retry logic
    const user = await userRepo.createUser(userData)
    console.log('Created user:', user)
    
    // Example: Create a video job
    const jobData = {
      user_id: user.id,
      original_filename: 'example.mp4',
      original_filesize: 1024000,
      status: 'queued' as const,
      clip_count: 5,
      quality_preset: 'social' as const,
      enhancement_level: 'basic' as const
    }
    
    const job = await jobRepo.createJob(jobData)
    console.log('Created job:', job)
    
    return { user, job }
  } catch (error) {
    console.error('❌ Repository example failed:', error)
    throw error
  }
}

// Example 3: Connection monitoring
export function connectionMonitoringExample() {
  const manager = getConnectionManager()
  
  // Listen for connection state changes
  const unsubscribe = manager.onStateChange((state) => {
    console.log(`🔌 Connection state changed: ${state}`)
    
    switch (state) {
      case ConnectionState.CONNECTING:
        console.log('⏳ Connecting to database...')
        break
      case ConnectionState.CONNECTED:
        console.log('✅ Database connected')
        break
      case ConnectionState.RECONNECTING:
        console.log('🔄 Reconnecting to database...')
        break
      case ConnectionState.ERROR:
        console.log('❌ Database connection error')
        break
      case ConnectionState.DISCONNECTED:
        console.log('🔌 Database disconnected')
        break
    }
  })
  
  // Return cleanup function
  return unsubscribe
}

// Example 4: Health check
export async function healthCheckExample() {
  try {
    console.log('🏥 Checking database health...')
    
    const health = await checkDatabaseHealth()
    
    console.log('Health status:', {
      connected: health.connected,
      state: health.state,
      latency: health.latency ? `${health.latency}ms` : 'N/A',
      error: health.error || 'None'
    })
    
    if (health.connected) {
      console.log('✅ Database is healthy')
    } else {
      console.log('❌ Database health check failed')
    }
    
    return health
  } catch (error) {
    console.error('❌ Health check failed:', error)
    throw error
  }
}

// Example 5: Error handling and retry
export async function errorHandlingExample() {
  const manager = getConnectionManager()
  
  try {
    // Example of using executeWithRetry for custom operations
    const result = await manager.executeWithRetry(async (client) => {
      // This operation will be retried automatically if it fails
      const { data, error } = await client
        .from('users')
        .select('count')
        .limit(1)
      
      if (error) {
        throw new SupabaseConnectionError(`Query failed: ${error.message}`)
      }
      
      return data
    })
    
    console.log('Query result:', result)
    return result
  } catch (error) {
    console.error('❌ Operation failed after retries:', error)
    throw error
  }
}

// Example 6: Configuration usage
export function configurationExample() {
  try {
    const config = getConfig()
    
    console.log('📋 Current configuration:')
    console.log('- Environment:', config.app.environment)
    console.log('- Supabase URL:', config.supabase.url)
    console.log('- Max retries:', config.supabase.maxRetries)
    console.log('- Retry delay:', config.supabase.retryDelay)
    console.log('- Connection timeout:', config.supabase.connectionTimeout)
    console.log('- Realtime enabled:', config.supabase.enableRealtime)
    console.log('- Auth enabled:', config.supabase.enableAuth)
    console.log('- Features:', config.features)
    
    return config
  } catch (error) {
    console.error('❌ Configuration error:', error)
    throw error
  }
}

// Example 7: Graceful shutdown
export async function shutdownExample() {
  try {
    console.log('🛑 Shutting down connection...')
    
    const manager = getConnectionManager()
    await manager.cleanup()
    
    console.log('✅ Shutdown complete')
  } catch (error) {
    console.error('❌ Shutdown error:', error)
    throw error
  }
}

// Example 8: API route integration
export function apiRouteExample() {
  // This would be used in a Next.js API route
  return async function handler(req: any, res: any) {
    try {
      // Ensure connection is available
      const manager = getConnectionManager()
      
      if (!manager.isConnected()) {
        await manager.connect()
      }
      
      // Use repositories for database operations
      const userRepo = RepositoryFactory.getUserRepository()
      
      // Example: Get user data
      const userId = req.query.userId
      const user = await userRepo.getUserById(userId)
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }
      
      res.json({ user })
    } catch (error) {
      console.error('API route error:', error)
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

// Example 9: React component integration
export function reactComponentExample() {
  // This would be used in a React component
  return function UserProfile({ userId }: { userId: string }) {
    const [user, setUser] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    
    React.useEffect(() => {
      let mounted = true
      
      const loadUser = async () => {
        try {
          setLoading(true)
          setError(null)
          
          // Ensure connection
          await initializeSupabase()
          
          // Get user data
          const userRepo = RepositoryFactory.getUserRepository()
          const userData = await userRepo.getUserById(userId)
          
          if (mounted) {
            setUser(userData)
          }
        } catch (err) {
          if (mounted) {
            setError(err instanceof Error ? err.message : 'Failed to load user')
          }
        } finally {
          if (mounted) {
            setLoading(false)
          }
        }
      }
      
      loadUser()
      
      return () => {
        mounted = false
      }
    }, [userId])
    
    if (loading) return React.createElement('div', null, 'Loading...')
    if (error) return React.createElement('div', null, `Error: ${error}`)
    if (!user) return React.createElement('div', null, 'User not found')
    
    return React.createElement('div', null, `User: ${user?.email || 'Unknown'}`)
  }
}

// Add React import for the component example
import React from 'react'
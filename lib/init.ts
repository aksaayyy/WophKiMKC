// Application initialization utilities
// Handles startup tasks like database connection and configuration validation

import { 
  initializeSupabase, 
  getConnectionManager,
  SupabaseConnectionError,
  SupabaseValidationError,
  ConnectionState
} from './supabase-connection'
import { loadConfig, getConfig, isDevelopment, isDebugEnabled } from './config'
import { checkDatabaseHealth } from './database-operations'

// Initialization result interface
export interface InitializationResult {
  success: boolean
  config: any
  database: {
    connected: boolean
    state: ConnectionState
    latency?: number
  }
  errors: string[]
  warnings: string[]
}

// Initialize the application
export async function initializeApp(): Promise<InitializationResult> {
  const result: InitializationResult = {
    success: false,
    config: null,
    database: {
      connected: false,
      state: ConnectionState.DISCONNECTED
    },
    errors: [],
    warnings: []
  }

  try {
    // Step 1: Load and validate configuration
    if (isDebugEnabled()) {
      console.log('🔧 Loading application configuration...')
    }

    try {
      result.config = loadConfig()
      if (isDebugEnabled()) {
        console.log('✅ Configuration loaded successfully')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown configuration error'
      result.errors.push(`Configuration error: ${message}`)
      
      if (isDevelopment()) {
        console.error('❌ Configuration validation failed:', error)
      }
      
      return result
    }

    // Step 2: Initialize Supabase connection
    if (isDebugEnabled()) {
      console.log('🔌 Initializing database connection...')
    }

    try {
      await initializeSupabase()
      
      // Check database health
      const healthCheck = await checkDatabaseHealth()
      result.database = healthCheck
      
      if (healthCheck.connected) {
        if (isDebugEnabled()) {
          console.log(`✅ Database connected (${healthCheck.latency}ms latency)`)
        }
      } else {
        result.warnings.push(`Database connection issue: ${healthCheck.error}`)
        if (isDevelopment()) {
          console.warn('⚠️ Database connection warning:', healthCheck.error)
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown database error'
      result.errors.push(`Database connection error: ${message}`)
      
      if (isDevelopment()) {
        console.error('❌ Database initialization failed:', error)
      }
      
      // Don't return early - app might still work without database
      result.warnings.push('Application running without database connection')
    }

    // Step 3: Validate environment-specific requirements
    if (isDevelopment()) {
      await validateDevelopmentEnvironment(result)
    }

    // Step 4: Set up connection monitoring
    setupConnectionMonitoring()

    // Success if no critical errors
    result.success = result.errors.length === 0

    if (result.success && isDebugEnabled()) {
      console.log('🚀 Application initialized successfully')
      if (result.warnings.length > 0) {
        console.log('⚠️ Warnings:', result.warnings)
      }
    }

    return result

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown initialization error'
    result.errors.push(`Initialization failed: ${message}`)
    
    if (isDevelopment()) {
      console.error('❌ Application initialization failed:', error)
    }
    
    return result
  }
}

// Validate development environment
async function validateDevelopmentEnvironment(result: InitializationResult): Promise<void> {
  const warnings: string[] = []
  
  // Check if Supabase is running locally
  const config = getConfig()
  if (config.supabase.url.includes('localhost') || config.supabase.url.includes('127.0.0.1')) {
    try {
      const response = await fetch(`${config.supabase.url}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
      
      if (!response.ok) {
        warnings.push('Local Supabase instance may not be running')
      }
    } catch {
      warnings.push('Cannot reach local Supabase instance - make sure it\'s running')
    }
  }

  // Check for development-specific environment variables
  const devEnvVars = [
    'NEXT_PUBLIC_DEBUG',
    'NODE_ENV'
  ]

  for (const envVar of devEnvVars) {
    if (!process.env[envVar]) {
      warnings.push(`Development environment variable ${envVar} not set`)
    }
  }

  result.warnings.push(...warnings)
}

// Set up connection monitoring
function setupConnectionMonitoring(): void {
  if (typeof window === 'undefined') {
    // Server-side monitoring
    const manager = getConnectionManager()
    
    manager.onStateChange((state) => {
      if (isDebugEnabled()) {
        console.log(`🔌 Database connection state changed: ${state}`)
      }
      
      if (state === ConnectionState.ERROR) {
        console.error('❌ Database connection lost')
      } else if (state === ConnectionState.CONNECTED) {
        console.log('✅ Database connection restored')
      }
    })
  } else {
    // Client-side monitoring
    window.addEventListener('online', () => {
      if (isDebugEnabled()) {
        console.log('🌐 Network connection restored')
      }
    })
    
    window.addEventListener('offline', () => {
      if (isDebugEnabled()) {
        console.log('🌐 Network connection lost')
      }
    })
  }
}

// Graceful shutdown
export async function shutdownApp(): Promise<void> {
  if (isDebugEnabled()) {
    console.log('🛑 Shutting down application...')
  }

  try {
    const manager = getConnectionManager()
    await manager.cleanup()
    
    if (isDebugEnabled()) {
      console.log('✅ Application shutdown complete')
    }
  } catch (error) {
    console.error('❌ Error during shutdown:', error)
  }
}

// Health check endpoint helper
export async function getHealthStatus(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  database: any
  config: {
    environment: string
    features: any
  }
}> {
  const config = getConfig()
  const dbHealth = await checkDatabaseHealth()
  
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
  
  if (!dbHealth.connected) {
    status = 'unhealthy'
  } else if (dbHealth.latency && dbHealth.latency > 1000) {
    status = 'degraded'
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    database: {
      connected: dbHealth.connected,
      state: dbHealth.state,
      latency: dbHealth.latency,
      error: dbHealth.error
    },
    config: {
      environment: config.app.environment,
      features: config.features
    }
  }
}

// Middleware for API routes to ensure initialization
export function withInitialization<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const manager = getConnectionManager()
    
    if (!manager.isConnected()) {
      try {
        await manager.connect()
      } catch (error) {
        if (isDevelopment()) {
          console.warn('API called without database connection:', error)
        }
        // Continue without database - some operations might still work
      }
    }
    
    return handler(...args)
  }
}

// React hook for initialization status (client-side)
export function useInitialization() {
  if (typeof window === 'undefined') {
    throw new Error('useInitialization can only be used on the client side')
  }

  const [status, setStatus] = React.useState<{
    initialized: boolean
    loading: boolean
    error: string | null
    database: { connected: boolean; state: ConnectionState }
  }>({
    initialized: false,
    loading: true,
    error: null,
    database: { connected: false, state: ConnectionState.DISCONNECTED }
  })

  React.useEffect(() => {
    let mounted = true

    const initialize = async () => {
      try {
        const result = await initializeApp()
        
        if (mounted) {
          setStatus({
            initialized: result.success,
            loading: false,
            error: result.errors.length > 0 ? result.errors.join(', ') : null,
            database: result.database
          })
        }
      } catch (error) {
        if (mounted) {
          setStatus({
            initialized: false,
            loading: false,
            error: error instanceof Error ? error.message : 'Initialization failed',
            database: { connected: false, state: ConnectionState.ERROR }
          })
        }
      }
    }

    initialize()

    return () => {
      mounted = false
    }
  }, [])

  return status
}

// Add React import for the hook
import React from 'react'
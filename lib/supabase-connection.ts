// Supabase Connection Manager
// Handles database connections, retries, and error management

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../../types/supabase'

// Configuration interface
export interface SupabaseConfig {
  url: string
  anonKey: string
  serviceRoleKey?: string
  maxRetries?: number
  retryDelay?: number
  connectionTimeout?: number
  enableRealtime?: boolean
  enableAuth?: boolean
}

// Connection state enum
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
  RECONNECTING = 'reconnecting'
}

// Custom error classes
export class SupabaseConnectionError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message)
    this.name = 'SupabaseConnectionError'
  }
}

export class SupabaseAuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'SupabaseAuthError'
  }
}

export class SupabaseValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'SupabaseValidationError'
  }
}

// Connection manager class
export class SupabaseConnectionManager {
  private client: SupabaseClient<Database> | null = null
  private adminClient: SupabaseClient<Database> | null = null
  private config: SupabaseConfig
  private state: ConnectionState = ConnectionState.DISCONNECTED
  private retryCount = 0
  private connectionListeners: Array<(state: ConnectionState) => void> = []
  private healthCheckInterval: NodeJS.Timeout | null = null

  constructor(config: SupabaseConfig) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      connectionTimeout: 10000,
      enableRealtime: true,
      enableAuth: true,
      ...config
    }
    
    this.validateConfig()
  }

  // Validate configuration
  private validateConfig(): void {
    if (!this.config.url) {
      throw new SupabaseValidationError('Supabase URL is required', 'url')
    }
    
    if (!this.config.anonKey) {
      throw new SupabaseValidationError('Supabase anonymous key is required', 'anonKey')
    }

    // Validate URL format
    try {
      new URL(this.config.url)
    } catch {
      throw new SupabaseValidationError('Invalid Supabase URL format', 'url')
    }

    // Validate key format (basic check)
    if (this.config.anonKey.length < 32) {
      throw new SupabaseValidationError('Invalid anonymous key format', 'anonKey')
    }
  }

  // Initialize connection
  public async connect(): Promise<void> {
    if (this.state === ConnectionState.CONNECTING) {
      throw new SupabaseConnectionError('Connection already in progress')
    }

    this.setState(ConnectionState.CONNECTING)
    
    try {
      // Create client instance
      this.client = createClient<Database>(
        this.config.url,
        this.config.anonKey,
        {
          auth: {
            autoRefreshToken: this.config.enableAuth,
            persistSession: this.config.enableAuth,
            detectSessionInUrl: this.config.enableAuth
          },
          realtime: this.config.enableRealtime ? {
            params: {
              eventsPerSecond: 10
            }
          } : undefined
        }
      )

      // Create admin client if service role key is provided
      if (this.config.serviceRoleKey) {
        this.adminClient = createClient<Database>(
          this.config.url,
          this.config.serviceRoleKey,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        )
      }

      // Test connection
      await this.testConnection()
      
      this.setState(ConnectionState.CONNECTED)
      this.retryCount = 0
      
      // Start health check
      this.startHealthCheck()
      
    } catch (error) {
      this.setState(ConnectionState.ERROR)
      throw new SupabaseConnectionError(
        `Failed to connect to Supabase: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONNECTION_FAILED',
        error
      )
    }
  }

  // Test connection by making a simple query
  private async testConnection(): Promise<void> {
    if (!this.client) {
      throw new SupabaseConnectionError('Client not initialized')
    }

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), this.config.connectionTimeout)
    })

    const testPromise = this.client
      .from('users')
      .select('count')
      .limit(1)
      .single()

    try {
      await Promise.race([testPromise, timeoutPromise])
    } catch (error) {
      // If table doesn't exist yet, that's okay - connection is working
      if (error instanceof Error && error.message.includes('relation "users" does not exist')) {
        return
      }
      throw error
    }
  }

  // Disconnect from Supabase
  public async disconnect(): Promise<void> {
    this.stopHealthCheck()
    
    if (this.client) {
      // Close realtime connections
      if (this.config.enableRealtime) {
        this.client.removeAllChannels()
      }
      this.client = null
    }
    
    if (this.adminClient) {
      this.adminClient = null
    }
    
    this.setState(ConnectionState.DISCONNECTED)
  }

  // Reconnect with exponential backoff
  public async reconnect(): Promise<void> {
    if (this.retryCount >= (this.config.maxRetries || 3)) {
      throw new SupabaseConnectionError('Maximum retry attempts exceeded')
    }

    this.setState(ConnectionState.RECONNECTING)
    this.retryCount++

    // Exponential backoff delay
    const delay = (this.config.retryDelay || 1000) * Math.pow(2, this.retryCount - 1)
    await new Promise(resolve => setTimeout(resolve, delay))

    try {
      await this.connect()
    } catch (error) {
      if (this.retryCount < (this.config.maxRetries || 3)) {
        return this.reconnect()
      }
      throw error
    }
  }

  // Get client instance
  public getClient(): SupabaseClient<Database> {
    if (!this.client || this.state !== ConnectionState.CONNECTED) {
      throw new SupabaseConnectionError('Not connected to Supabase')
    }
    return this.client
  }

  // Get admin client instance
  public getAdminClient(): SupabaseClient<Database> {
    if (!this.adminClient || this.state !== ConnectionState.CONNECTED) {
      throw new SupabaseConnectionError('Admin client not available')
    }
    return this.adminClient
  }

  // Get connection state
  public getState(): ConnectionState {
    return this.state
  }

  // Check if connected
  public isConnected(): boolean {
    return this.state === ConnectionState.CONNECTED && this.client !== null
  }

  // Add connection state listener
  public onStateChange(listener: (state: ConnectionState) => void): () => void {
    this.connectionListeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      const index = this.connectionListeners.indexOf(listener)
      if (index > -1) {
        this.connectionListeners.splice(index, 1)
      }
    }
  }

  // Set connection state and notify listeners
  private setState(state: ConnectionState): void {
    if (this.state !== state) {
      this.state = state
      this.connectionListeners.forEach(listener => {
        try {
          listener(state)
        } catch (error) {
          console.error('Error in connection state listener:', error)
        }
      })
    }
  }

  // Start health check interval
  private startHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.testConnection()
      } catch (error) {
        console.warn('Health check failed, attempting reconnection:', error)
        this.setState(ConnectionState.ERROR)
        
        try {
          await this.reconnect()
        } catch (reconnectError) {
          console.error('Reconnection failed:', reconnectError)
        }
      }
    }, 30000) // Check every 30 seconds
  }

  // Stop health check interval
  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
  }

  // Execute query with retry logic
  public async executeWithRetry<T>(
    operation: (client: SupabaseClient<Database>) => Promise<T>,
    useAdmin = false
  ): Promise<T> {
    const client = useAdmin ? this.getAdminClient() : this.getClient()
    
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= (this.config.maxRetries || 3); attempt++) {
      try {
        return await operation(client)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        // Don't retry on validation errors
        if (error instanceof SupabaseValidationError) {
          throw error
        }
        
        // Don't retry on auth errors
        if (error instanceof SupabaseAuthError) {
          throw error
        }
        
        // If this is the last attempt, throw the error
        if (attempt === (this.config.maxRetries || 3)) {
          break
        }
        
        // Wait before retry
        const delay = (this.config.retryDelay || 1000) * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
        
        // Try to reconnect if connection seems lost
        if (this.state !== ConnectionState.CONNECTED) {
          try {
            await this.reconnect()
          } catch (reconnectError) {
            console.warn('Reconnection failed during retry:', reconnectError)
          }
        }
      }
    }
    
    throw new SupabaseConnectionError(
      `Operation failed after ${this.config.maxRetries} retries: ${lastError?.message}`,
      'OPERATION_FAILED',
      lastError
    )
  }

  // Cleanup resources
  public async cleanup(): Promise<void> {
    this.stopHealthCheck()
    await this.disconnect()
    this.connectionListeners.length = 0
  }
}

// Environment variable validation
export function validateEnvironmentVariables(): SupabaseConfig {
  const requiredVars = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  }

  // Check required variables
  if (!requiredVars.url) {
    throw new SupabaseValidationError('NEXT_PUBLIC_SUPABASE_URL environment variable is required')
  }

  if (!requiredVars.anonKey) {
    throw new SupabaseValidationError('NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required')
  }

  return {
    url: requiredVars.url,
    anonKey: requiredVars.anonKey,
    serviceRoleKey: requiredVars.serviceRoleKey,
    maxRetries: parseInt(process.env.SUPABASE_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.SUPABASE_RETRY_DELAY || '1000'),
    connectionTimeout: parseInt(process.env.SUPABASE_CONNECTION_TIMEOUT || '10000'),
    enableRealtime: process.env.SUPABASE_ENABLE_REALTIME !== 'false',
    enableAuth: process.env.SUPABASE_ENABLE_AUTH !== 'false'
  }
}

// Global connection manager instance
let globalConnectionManager: SupabaseConnectionManager | null = null

// Get or create global connection manager
export function getConnectionManager(): SupabaseConnectionManager {
  if (!globalConnectionManager) {
    const config = validateEnvironmentVariables()
    globalConnectionManager = new SupabaseConnectionManager(config)
  }
  return globalConnectionManager
}

// Initialize connection manager (call this in your app startup)
export async function initializeSupabase(): Promise<SupabaseConnectionManager> {
  const manager = getConnectionManager()
  
  if (!manager.isConnected()) {
    await manager.connect()
  }
  
  return manager
}
// Configuration management for Video Clipper Pro
// Handles environment variable validation and application configuration

import { SupabaseValidationError } from './supabase-connection'

// Application configuration interface
export interface AppConfig {
  supabase: {
    url: string
    anonKey: string
    serviceRoleKey?: string
    maxRetries: number
    retryDelay: number
    connectionTimeout: number
    enableRealtime: boolean
    enableAuth: boolean
  }
  database: {
    url?: string
    maxConnections?: number
    connectionTimeout?: number
  }
  auth: {
    secret?: string
    url?: string
    providers: {
      google?: {
        clientId?: string
        clientSecret?: string
      }
      github?: {
        clientId?: string
        clientSecret?: string
      }
    }
  }
  storage: {
    bucket: string
    maxFileSize: string
    tempPath: string
  }
  app: {
    url: string
    apiUrl: string
    environment: 'development' | 'staging' | 'production'
    debug: boolean
  }
  features: {
    enableTeams: boolean
    enableTemplates: boolean
    enableAnalytics: boolean
  }
  processing: {
    timeout: number
    maxConcurrent?: number
  }
}

// Environment variable mapping
const ENV_MAPPINGS = {
  // Supabase configuration
  'NEXT_PUBLIC_SUPABASE_URL': 'supabase.url',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'supabase.anonKey',
  'SUPABASE_SERVICE_ROLE_KEY': 'supabase.serviceRoleKey',
  'SUPABASE_MAX_RETRIES': 'supabase.maxRetries',
  'SUPABASE_RETRY_DELAY': 'supabase.retryDelay',
  'SUPABASE_CONNECTION_TIMEOUT': 'supabase.connectionTimeout',
  'SUPABASE_ENABLE_REALTIME': 'supabase.enableRealtime',
  'SUPABASE_ENABLE_AUTH': 'supabase.enableAuth',

  // Database configuration
  'DATABASE_URL': 'database.url',
  'DATABASE_MAX_CONNECTIONS': 'database.maxConnections',
  'DATABASE_CONNECTION_TIMEOUT': 'database.connectionTimeout',

  // Authentication configuration
  'NEXTAUTH_SECRET': 'auth.secret',
  'NEXTAUTH_URL': 'auth.url',
  'GOOGLE_CLIENT_ID': 'auth.providers.google.clientId',
  'GOOGLE_CLIENT_SECRET': 'auth.providers.google.clientSecret',
  'GITHUB_CLIENT_ID': 'auth.providers.github.clientId',
  'GITHUB_CLIENT_SECRET': 'auth.providers.github.clientSecret',

  // Storage configuration
  'NEXT_PUBLIC_STORAGE_BUCKET': 'storage.bucket',
  'MAX_FILE_SIZE': 'storage.maxFileSize',
  'TEMP_STORAGE_PATH': 'storage.tempPath',

  // Application configuration
  'NEXT_PUBLIC_APP_URL': 'app.url',
  'NEXT_PUBLIC_API_URL': 'app.apiUrl',
  'NODE_ENV': 'app.environment',
  'NEXT_PUBLIC_DEBUG': 'app.debug',

  // Feature flags
  'NEXT_PUBLIC_ENABLE_TEAMS': 'features.enableTeams',
  'NEXT_PUBLIC_ENABLE_TEMPLATES': 'features.enableTemplates',
  'NEXT_PUBLIC_ENABLE_ANALYTICS': 'features.enableAnalytics',

  // Processing configuration
  'PROCESSING_TIMEOUT': 'processing.timeout',
  'PROCESSING_MAX_CONCURRENT': 'processing.maxConcurrent'
} as const

// Default configuration values
const DEFAULT_CONFIG: AppConfig = {
  supabase: {
    url: '',
    anonKey: '',
    maxRetries: 3,
    retryDelay: 1000,
    connectionTimeout: 10000,
    enableRealtime: true,
    enableAuth: true
  },
  database: {
    maxConnections: 10,
    connectionTimeout: 5000
  },
  auth: {
    providers: {}
  },
  storage: {
    bucket: 'video-clipper-storage',
    maxFileSize: '50MB',
    tempPath: '/tmp/video-clipper'
  },
  app: {
    url: 'http://localhost:3000',
    apiUrl: 'http://localhost:3000/api',
    environment: 'development',
    debug: false
  },
  features: {
    enableTeams: true,
    enableTemplates: true,
    enableAnalytics: true
  },
  processing: {
    timeout: 300000
  }
}

// Required environment variables
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
] as const

// Validation rules for environment variables
const VALIDATION_RULES = {
  'NEXT_PUBLIC_SUPABASE_URL': (value: string) => {
    try {
      new URL(value)
      return true
    } catch {
      return 'Invalid URL format'
    }
  },
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': (value: string) => {
    if (value.length < 32) {
      return 'Key must be at least 32 characters long'
    }
    return true
  },
  'SUPABASE_SERVICE_ROLE_KEY': (value: string) => {
    if (value && value.length < 32) {
      return 'Service role key must be at least 32 characters long'
    }
    return true
  },
  'MAX_FILE_SIZE': (value: string) => {
    const sizeRegex = /^\d+(?:KB|MB|GB)$/i
    if (!sizeRegex.test(value)) {
      return 'File size must be in format like "50MB", "1GB", etc.'
    }
    return true
  },
  'PROCESSING_TIMEOUT': (value: string) => {
    const timeout = parseInt(value)
    if (isNaN(timeout) || timeout < 1000) {
      return 'Timeout must be a number >= 1000 (milliseconds)'
    }
    return true
  }
} as const

// Set nested object property using dot notation
function setNestedProperty(obj: any, path: string, value: any): void {
  const keys = path.split('.')
  let current = obj
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current)) {
      current[key] = {}
    }
    current = current[key]
  }
  
  current[keys[keys.length - 1]] = value
}

// Parse environment variable value to appropriate type
function parseEnvValue(key: string, value: string): any {
  // Boolean values
  if (value.toLowerCase() === 'true') return true
  if (value.toLowerCase() === 'false') return false
  
  // Number values
  if (key.includes('TIMEOUT') || key.includes('RETRIES') || key.includes('DELAY') || key.includes('CONNECTIONS')) {
    const num = parseInt(value)
    return isNaN(num) ? value : num
  }
  
  // String values
  return value
}

// Validate environment variable
function validateEnvVar(key: string, value: string): void {
  const validator = VALIDATION_RULES[key as keyof typeof VALIDATION_RULES]
  if (validator) {
    const result = validator(value)
    if (result !== true) {
      throw new SupabaseValidationError(`Invalid ${key}: ${result}`, key)
    }
  }
}

// Load and validate configuration from environment variables
export function loadConfig(): AppConfig {
  const config = JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as AppConfig
  const missingRequired: string[] = []
  const validationErrors: string[] = []

  // Check required environment variables
  for (const requiredVar of REQUIRED_ENV_VARS) {
    const value = process.env[requiredVar]
    if (!value) {
      missingRequired.push(requiredVar)
    }
  }

  if (missingRequired.length > 0) {
    throw new SupabaseValidationError(
      `Missing required environment variables: ${missingRequired.join(', ')}`
    )
  }

  // Load and validate environment variables
  for (const [envKey, configPath] of Object.entries(ENV_MAPPINGS)) {
    const value = process.env[envKey]
    
    if (value !== undefined) {
      try {
        validateEnvVar(envKey, value)
        const parsedValue = parseEnvValue(envKey, value)
        setNestedProperty(config, configPath, parsedValue)
      } catch (error) {
        if (error instanceof SupabaseValidationError) {
          validationErrors.push(error.message)
        } else {
          validationErrors.push(`Error processing ${envKey}: ${error}`)
        }
      }
    }
  }

  if (validationErrors.length > 0) {
    throw new SupabaseValidationError(
      `Configuration validation errors:\n${validationErrors.join('\n')}`
    )
  }

  return config
}

// Get configuration value by path
export function getConfigValue<T = any>(path: string, defaultValue?: T): T {
  try {
    const config = loadConfig()
    const keys = path.split('.')
    let current: any = config
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        return defaultValue as T
      }
    }
    
    return current as T
  } catch {
    return defaultValue as T
  }
}

// Check if running in development mode
export function isDevelopment(): boolean {
  return getConfigValue('app.environment', 'development') === 'development'
}

// Check if running in production mode
export function isProduction(): boolean {
  const env = getConfigValue<string>('app.environment', 'development')
  return env === 'production'
}

// Check if debug mode is enabled
export function isDebugEnabled(): boolean {
  const debug = getConfigValue<boolean>('app.debug', false)
  return debug === true
}

// Get feature flag value
export function isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
  return getConfigValue(`features.${feature}`, true) === true
}

// Validate configuration on module load (in development)
if (isDevelopment()) {
  try {
    loadConfig()
    console.log('✅ Configuration loaded successfully')
  } catch (error) {
    console.error('❌ Configuration validation failed:', error)
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1)
    }
  }
}

// Export singleton config instance
let configInstance: AppConfig | null = null

export function getConfig(): AppConfig {
  if (!configInstance) {
    configInstance = loadConfig()
  }
  return configInstance
}

// Reset config instance (useful for testing)
export function resetConfig(): void {
  configInstance = null
}
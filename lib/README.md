# Supabase Connection Manager

This directory contains the Supabase database integration layer for Video Clipper Pro, providing robust connection management, error handling, and retry logic.

## Overview

The connection manager provides:
- **Automatic connection management** with retry logic
- **Environment variable validation** and configuration loading
- **Repository pattern** for database operations
- **Real-time connection monitoring** and health checks
- **Type-safe database operations** with TypeScript support
- **Error handling** with custom error types

## Files

### Core Files

- **`supabase-connection.ts`** - Main connection manager class with retry logic
- **`config.ts`** - Configuration management and environment variable validation
- **`database-operations.ts`** - Repository classes for database operations
- **`supabase.ts`** - Legacy Supabase client setup (updated to use connection manager)
- **`init.ts`** - Application initialization utilities

### Supporting Files

- **`examples/connection-usage.ts`** - Usage examples for different scenarios
- **`__tests__/supabase-connection.test.ts`** - Unit tests for connection manager

## Quick Start

### 1. Environment Setup

Create a `.env.local` file with the required environment variables:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional (with defaults)
SUPABASE_MAX_RETRIES=3
SUPABASE_RETRY_DELAY=1000
SUPABASE_CONNECTION_TIMEOUT=10000
SUPABASE_ENABLE_REALTIME=true
SUPABASE_ENABLE_AUTH=true
```

### 2. Basic Usage

```typescript
import { initializeSupabase, RepositoryFactory } from './lib'

// Initialize connection
await initializeSupabase()

// Use repositories
const userRepo = RepositoryFactory.getUserRepository()
const user = await userRepo.getUserById('user-id')
```

### 3. API Route Integration

```typescript
import { getConnectionManager, RepositoryFactory } from './lib'

export default async function handler(req, res) {
  try {
    // Ensure connection
    const manager = getConnectionManager()
    if (!manager.isConnected()) {
      await manager.connect()
    }
    
    // Use repositories
    const userRepo = RepositoryFactory.getUserRepository()
    const users = await userRepo.getUserJobs(req.query.userId)
    
    res.json({ users })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
```

## Architecture

### Connection Manager

The `SupabaseConnectionManager` class provides:

- **Connection lifecycle management** (connect, disconnect, reconnect)
- **Automatic retry logic** with exponential backoff
- **Health monitoring** with periodic checks
- **State management** with event listeners
- **Error handling** with custom error types

### Repository Pattern

Database operations are organized into repository classes:

- **`UserRepository`** - User management operations
- **`VideoJobRepository`** - Video job tracking operations
- **`TeamRepository`** - Team collaboration operations
- **`TemplateRepository`** - Template management operations
- **`UsageTrackingRepository`** - Usage analytics operations

### Configuration Management

The configuration system:

- **Validates environment variables** at startup
- **Provides type-safe configuration** access
- **Supports feature flags** and environment-specific settings
- **Handles default values** for optional settings

## Error Handling

Custom error types provide specific error handling:

```typescript
import { 
  SupabaseConnectionError, 
  SupabaseAuthError, 
  SupabaseValidationError 
} from './lib'

try {
  await operation()
} catch (error) {
  if (error instanceof SupabaseConnectionError) {
    // Handle connection issues
  } else if (error instanceof SupabaseValidationError) {
    // Handle validation errors
  }
}
```

## Connection States

The connection manager tracks these states:

- **`DISCONNECTED`** - No connection established
- **`CONNECTING`** - Connection in progress
- **`CONNECTED`** - Successfully connected
- **`RECONNECTING`** - Attempting to reconnect
- **`ERROR`** - Connection failed

## Monitoring

### Health Checks

```typescript
import { checkDatabaseHealth } from './lib'

const health = await checkDatabaseHealth()
console.log('Connected:', health.connected)
console.log('Latency:', health.latency)
```

### Connection Monitoring

```typescript
import { getConnectionManager } from './lib'

const manager = getConnectionManager()
const unsubscribe = manager.onStateChange((state) => {
  console.log('Connection state:', state)
})
```

## Testing

Run the test suite:

```bash
npm test lib/__tests__/supabase-connection.test.ts
```

The tests cover:
- Configuration validation
- Connection state management
- Error handling
- Retry logic

## Best Practices

### 1. Initialize Early

Initialize the connection manager early in your application lifecycle:

```typescript
// In _app.tsx or layout.tsx
import { initializeSupabase } from './lib'

export default function App() {
  useEffect(() => {
    initializeSupabase().catch(console.error)
  }, [])
  
  return <YourApp />
}
```

### 2. Use Repositories

Always use repository classes instead of direct Supabase client access:

```typescript
// Good
const userRepo = RepositoryFactory.getUserRepository()
const user = await userRepo.getUserById(id)

// Avoid
const { data } = await supabase.from('users').select('*').eq('id', id)
```

### 3. Handle Errors Gracefully

Implement proper error handling for different scenarios:

```typescript
try {
  const result = await operation()
} catch (error) {
  if (error instanceof SupabaseConnectionError) {
    // Show connection error message
    showError('Connection issue. Please try again.')
  } else if (error instanceof SupabaseValidationError) {
    // Show validation error
    showError(error.message)
  } else {
    // Generic error handling
    showError('An unexpected error occurred.')
  }
}
```

### 4. Monitor Connection Health

Implement connection monitoring in production:

```typescript
const manager = getConnectionManager()
manager.onStateChange((state) => {
  if (state === ConnectionState.ERROR) {
    // Alert monitoring system
    alerting.notify('Database connection lost')
  }
})
```

## Migration from Legacy Code

If you have existing code using the old Supabase client directly:

### Before
```typescript
import { supabase } from './lib/supabase'

const { data } = await supabase.from('users').select('*')
```

### After
```typescript
import { RepositoryFactory } from './lib'

const userRepo = RepositoryFactory.getUserRepository()
const users = await userRepo.getUsers()
```

## Troubleshooting

### Common Issues

1. **Connection Timeout**
   - Check if Supabase URL is accessible
   - Verify network connectivity
   - Increase `SUPABASE_CONNECTION_TIMEOUT` if needed

2. **Authentication Errors**
   - Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
   - Check RLS policies in Supabase dashboard
   - Ensure user has proper permissions

3. **Validation Errors**
   - Check all required environment variables are set
   - Verify environment variable formats
   - Review configuration validation errors

### Debug Mode

Enable debug logging:

```bash
NEXT_PUBLIC_DEBUG=true
```

This will log connection state changes and configuration details.

## Contributing

When adding new database operations:

1. Add the operation to the appropriate repository class
2. Include proper error handling
3. Add TypeScript types for parameters and return values
4. Write unit tests for the new functionality
5. Update this documentation

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **6.4**: Environment variable validation and configuration loading
- **6.5**: Proper error handling for database connection failures
- **Connection management**: Robust connection handling with retry logic
- **Type safety**: Full TypeScript support with generated types
- **Repository pattern**: Clean separation of database operations
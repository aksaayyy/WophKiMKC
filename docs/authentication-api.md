# Authentication API Documentation

This document describes the authentication and user management API endpoints for Video Clipper Pro.

## Authentication Endpoints

### POST /api/v1/auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "subscription_tier": "free" // optional, defaults to "free"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "subscription_tier": "free",
    "email_confirmed": false
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_in": 3600
  }
}
```

### POST /api/v1/auth/login

Authenticate an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "subscription_tier": "free",
    "team_id": null,
    "email_confirmed": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_in": 3600
  }
}
```

### POST /api/v1/auth/logout

Sign out the current user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

### POST /api/v1/auth/reset-password

Request a password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset email sent successfully"
}
```

### PUT /api/v1/auth/reset-password

Update password using reset token.

**Request Body:**
```json
{
  "access_token": "reset_token",
  "refresh_token": "refresh_token",
  "password": "newsecurepassword123"
}
```

**Response (200):**
```json
{
  "message": "Password updated successfully"
}
```

### POST /api/v1/auth/verify-email

Resend email verification.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Verification email sent successfully"
}
```

### PUT /api/v1/auth/verify-email

Verify email with token.

**Request Body:**
```json
{
  "token": "verification_token",
  "type": "signup"
}
```

**Response (200):**
```json
{
  "message": "Email verified successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "email_confirmed": true
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

## User Management Endpoints

### GET /api/v1/user/profile

Get current user profile and usage statistics.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "subscription_tier": "free",
    "team_id": null,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "usage": {
    "clips_processed": 5,
    "processing_time": 300,
    "storage_used": 1048576,
    "period_month": 1,
    "period_year": 2024
  }
}
```

### PUT /api/v1/user/profile

Update user profile.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "subscription_tier": "pro", // optional
  "team_id": "team_uuid" // optional
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "subscription_tier": "pro",
    "team_id": "team_uuid",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z"
  }
}
```

### GET /api/v1/user/usage

Get detailed usage statistics and limits.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "subscription_tier": "free",
  "can_process": true,
  "current_usage": {
    "clips_processed": 5,
    "processing_time": 300,
    "storage_used": 1048576,
    "period_month": 1,
    "period_year": 2024
  },
  "limits": {
    "clips_per_month": 10,
    "processing_time_minutes": 60,
    "storage_gb": 1,
    "team_members": 1
  },
  "usage_percentage": {
    "clips": 50,
    "processing_time": 8,
    "storage": 0
  }
}
```

### POST /api/v1/user/usage/check

Check if user can process a video request.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "clip_count": 3,
  "estimated_processing_time": 120,
  "estimated_storage": 52428800
}
```

**Response (200):**
```json
{
  "can_process": true,
  "current_usage": {
    "clips_processed": 5,
    "processing_time": 300,
    "storage_used": 1048576
  },
  "limits": {
    "clips_per_month": 10,
    "processing_time_minutes": 60,
    "storage_gb": 1,
    "team_members": 1
  },
  "estimated_usage_after": {
    "clips_processed": 8,
    "processing_time": 420,
    "storage_used": 53477376
  }
}
```

### GET /api/v1/user/jobs

Get user's video processing jobs.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `limit` (optional): Number of jobs to return (default: 50)
- `status` (optional): Filter by job status (queued, processing, completed, failed)

**Response (200):**
```json
{
  "user_jobs": [
    {
      "id": "job_uuid",
      "user_id": "user_uuid",
      "team_id": null,
      "original_filename": "https://youtube.com/watch?v=example",
      "original_filesize": 0,
      "status": "completed",
      "clip_count": 3,
      "quality_preset": "pro",
      "enhancement_level": "none",
      "platform_target": "tiktok",
      "output_files": ["/processed/job_uuid/clip1.mp4"],
      "processing_time": 120,
      "created_at": "2024-01-01T00:00:00Z",
      "started_at": "2024-01-01T00:01:00Z",
      "completed_at": "2024-01-01T00:03:00Z"
    }
  ],
  "team_jobs": [],
  "total_jobs": 1
}
```

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**
```json
{
  "error": "Validation error message"
}
```

**401 Unauthorized:**
```json
{
  "error": "Missing or invalid Authorization header"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**429 Too Many Requests:**
```json
{
  "error": "Rate limit exceeded"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

## Subscription Tiers

- **free**: 10 clips/month, 60 minutes processing, 1GB storage, 1 team member
- **pro**: 100 clips/month, 600 minutes processing, 10GB storage, 5 team members  
- **business**: 1000 clips/month, 6000 minutes processing, 100GB storage, 25 team members

## Authentication Flow

1. Register with `/api/v1/auth/register` or login with `/api/v1/auth/login`
2. Use the returned `access_token` in the `Authorization: Bearer <token>` header for all subsequent requests
3. The token expires after 1 hour - use the `refresh_token` to get a new access token
4. Call `/api/v1/auth/logout` to invalidate the session when done
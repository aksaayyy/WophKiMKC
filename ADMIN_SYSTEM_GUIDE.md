# Admin System Guide

## Overview

The Video Clipper Pro admin system provides comprehensive management and monitoring capabilities for system administrators. This guide covers all admin features, APIs, and best practices.

## Admin Access

### Authentication
- Admin users are identified by email addresses containing "admin" or the specific admin email
- All admin endpoints require Bearer token authentication
- Admin status is checked on every request for security

### Admin Routes
- `/admin` - Main admin dashboard
- `/admin/users` - User management
- `/admin/jobs` - Job management
- `/admin/settings` - System settings
- `/admin/activity` - Activity log

## Features

### 1. Dashboard Overview
- **Analytics Overview**: Real-time system metrics
- **Quick Actions**: Direct links to management sections
- **System Health**: Live health monitoring
- **Recent Activity**: Latest admin actions

### 2. User Management (`/admin/users`)
- View all registered users
- Search users by email
- View user statistics (join date, last login, job count)
- Delete users (with cascade deletion of their jobs)
- Email users directly
- Admin users are protected from deletion

### 3. Job Management (`/admin/jobs`)
- View all video processing jobs
- Filter by status (pending, processing, completed, failed)
- Search by filename or user email
- View detailed job information
- Delete jobs
- Update job status manually
- Monitor processing times and success rates

### 4. System Settings (`/admin/settings`)
- **File & Processing Settings**:
  - Max file size (MB)
  - Max clips per job
  - File retention hours
  - Max concurrent jobs
- **Quality & Platform Settings**:
  - Default quality preset
  - Allowed file types
- **Feature Toggles**:
  - Maintenance mode
  - YouTube download
  - Team features
- **Team Settings**:
  - Max users per team

### 5. Activity Log (`/admin/activity`)
- Complete audit trail of admin actions
- Filter by action type
- Search by user or target
- View IP addresses and user agents
- Detailed action information with JSON details

## API Endpoints

### Admin Stats
```
GET /api/v1/admin/stats
```
Returns basic system statistics including user counts, job counts, storage usage, and system health.

### Admin Analytics
```
GET /api/v1/admin/analytics?period=7d
```
Provides detailed analytics with charts and metrics. Supports periods: 24h, 7d, 30d, 90d.

### User Management
```
GET /api/v1/admin/users?limit=50&offset=0&search=query
DELETE /api/v1/admin/users
```

### Job Management
```
GET /api/v1/admin/jobs?limit=50&offset=0&status=completed&search=query
DELETE /api/v1/admin/jobs
PATCH /api/v1/admin/jobs (update status)
```

### System Settings
```
GET /api/v1/admin/settings
PUT /api/v1/admin/settings
```

### Activity Log
```
GET /api/v1/admin/activity?limit=50&offset=0&action=user_delete
POST /api/v1/admin/activity (log action)
```

### System Health
```
GET /api/v1/admin/health
```
Comprehensive health checks including database, file system, job processing, memory usage, and API response times.

### Notifications
```
GET /api/v1/admin/notifications?unread_only=true
POST /api/v1/admin/notifications
PATCH /api/v1/admin/notifications (mark as read)
DELETE /api/v1/admin/notifications
```

## Database Schema

### Admin Tables

#### system_settings
- `id`: Primary key (always 1)
- `settings`: JSONB configuration
- `updated_at`: Last update timestamp
- `updated_by`: Admin user ID

#### admin_activity_log
- `id`: UUID primary key
- `admin_user_id`: Admin who performed action
- `action`: Action type (user_delete, job_update, etc.)
- `target_type`: Type of target (user, job, settings)
- `target_id`: ID of target
- `details`: JSONB additional information
- `ip_address`: Client IP
- `user_agent`: Client user agent
- `created_at`: Action timestamp

#### system_notifications
- `id`: UUID primary key
- `type`: Notification type (info, warning, error, success)
- `title`: Notification title
- `message`: Notification content
- `is_read`: Read status
- `created_at`: Creation timestamp
- `expires_at`: Optional expiration

### User Extensions
- `role`: User role (user, admin, moderator)
- `is_admin`: Quick admin flag

## Security Features

### Access Control
- Row Level Security (RLS) on all admin tables
- Admin-only policies on sensitive data
- IP address and user agent logging
- Action audit trail

### Data Protection
- Sensitive operations require confirmation
- Cascade deletion protection for critical data
- Automatic cleanup of expired data
- Secure token validation

## Monitoring & Alerts

### Health Checks
- Database connectivity and performance
- File system accessibility
- Job processing status
- Memory usage monitoring
- API response times

### Activity Monitoring
- All admin actions are logged
- Failed operations are tracked
- Suspicious activity detection
- Performance metrics collection

## Best Practices

### Regular Maintenance
1. **File Cleanup**: Run cleanup operations regularly to free disk space
2. **Database Maintenance**: Monitor database performance and optimize queries
3. **Log Rotation**: Archive old activity logs to prevent database bloat
4. **Health Monitoring**: Check system health daily

### Security Guidelines
1. **Access Control**: Limit admin access to necessary personnel only
2. **Activity Review**: Regularly review admin activity logs
3. **Settings Backup**: Backup system settings before major changes
4. **Incident Response**: Have procedures for handling security incidents

### Performance Optimization
1. **Query Optimization**: Use appropriate indexes and query limits
2. **Caching**: Implement caching for frequently accessed data
3. **Resource Monitoring**: Monitor CPU, memory, and disk usage
4. **Scaling**: Plan for horizontal scaling as user base grows

## Troubleshooting

### Common Issues

#### High Memory Usage
- Check for memory leaks in processing jobs
- Restart services if memory usage exceeds 90%
- Review job queue for stuck processes

#### Slow Database Queries
- Check query execution plans
- Ensure proper indexing
- Consider query optimization

#### File System Issues
- Verify directory permissions
- Check available disk space
- Ensure cleanup processes are running

#### Job Processing Problems
- Check for stuck jobs in processing status
- Verify Python script dependencies
- Review error logs for processing failures

### Emergency Procedures

#### System Overload
1. Enable maintenance mode
2. Clear job queue if necessary
3. Restart services
4. Monitor system recovery

#### Data Corruption
1. Stop all processing
2. Backup current state
3. Restore from last known good backup
4. Verify data integrity

#### Security Breach
1. Immediately revoke admin access
2. Review activity logs
3. Change all admin credentials
4. Audit system for unauthorized changes

## Configuration

### Environment Variables
```bash
# Admin Configuration
ADMIN_EMAIL=admin@videoclipper.com
ADMIN_CLEANUP_KEY=your-secure-cleanup-key

# Database Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# File Storage
MAX_FILE_SIZE=500MB
FILE_RETENTION_HOURS=48
```

### Default Settings
```json
{
  "maxFileSize": 524288000,
  "maxClipsPerJob": 10,
  "fileRetentionHours": 48,
  "allowedFileTypes": ["mp4", "mov", "avi", "mkv", "webm"],
  "maintenanceMode": false,
  "maxConcurrentJobs": 5,
  "defaultQuality": "high",
  "enableYouTubeDownload": true,
  "enableTeamFeatures": true,
  "maxUsersPerTeam": 10
}
```

## Support

For technical support or questions about the admin system:

1. Check the activity logs for error details
2. Review system health status
3. Consult this documentation
4. Contact the development team with specific error messages and logs

## Updates

This admin system is designed to be extensible. Future updates may include:

- Advanced analytics and reporting
- Automated alert systems
- Integration with external monitoring tools
- Enhanced security features
- Performance optimization tools

---

**Last Updated**: November 2024
**Version**: 1.0.0
# 48-Hour File Retention System - Setup Instructions

## 🎯 Overview
This system automatically deletes video files after 48 hours while preserving metadata for statistics and tracking.

## 📋 Database Migration Required

Please run this SQL in your Supabase dashboard (SQL Editor):

```sql
-- Add file expiry tracking columns
ALTER TABLE video_jobs 
ADD COLUMN IF NOT EXISTS files_expired BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS files_expired_at TIMESTAMPTZ;

-- Add index for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_video_jobs_cleanup 
ON video_jobs (status, files_expired, completed_at) 
WHERE status = 'completed' AND files_expired = FALSE;

-- Add helpful comments
COMMENT ON COLUMN video_jobs.files_expired IS 'Whether the video files have been deleted after 48 hours';
COMMENT ON COLUMN video_jobs.files_expired_at IS 'When the video files were deleted';
```

## 🔧 Environment Variables

Add to your `.env.local`:

```env
# File Cleanup Configuration
ADMIN_CLEANUP_KEY=your_secure_cleanup_key_here
CLEANUP_URL=http://localhost:3002/api/v1/admin/cleanup
```

## 🤖 Automated Cleanup Setup

### Option 1: Cron Job (Recommended)
Add to your server's crontab to run cleanup every 6 hours:

```bash
# Edit crontab
crontab -e

# Add this line (runs every 6 hours)
0 */6 * * * cd /path/to/video-clipper-pro && node scripts/cleanup-cron.js
```

### Option 2: Manual Cleanup
Run cleanup manually via API:

```bash
curl -X POST http://localhost:3002/api/v1/admin/cleanup \
  -H "Authorization: Bearer your_secure_cleanup_key_here"
```

### Option 3: Programmatic Cleanup
```javascript
const response = await fetch('/api/v1/admin/cleanup', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_secure_cleanup_key_here'
  }
})
const result = await response.json()
console.log('Cleanup result:', result.stats)
```

## 📊 How It Works

### Timeline:
1. **Video Processing Completes** → Files available for download
2. **48 Hours Later** → Files automatically deleted, metadata preserved
3. **Dashboard Updates** → Shows "Files Expired" status

### What Gets Deleted:
- ✅ Video files (.mp4, .mov, .avi, etc.)
- ✅ Thumbnail images (.jpg, .png)
- ✅ Temporary processing files

### What Gets Preserved:
- ✅ Job metadata (filename, size, clip count, etc.)
- ✅ Processing statistics
- ✅ User analytics data
- ✅ Database records

## 🎨 UI Changes

### Dashboard:
- Shows "Files Expired" badge for old jobs
- Displays time remaining for recent jobs
- Hides download buttons for expired files

### Job Details:
- Shows expiry countdown for active files
- Displays "Files Expired" message for old jobs
- Preserves clip metadata and statistics

### Video Preview:
- Shows expiry warning for files nearing expiration
- Replaces download buttons with expiry message
- Maintains clip count and processing info

## 🔍 Testing

### Test File Expiry Logic:
```javascript
import { isJobExpired, getTimeUntilExpiry } from '@/lib/fileCleanup'

// Test with a job completed 50 hours ago (should be expired)
const expiredJob = '2024-01-01T00:00:00Z'
console.log('Is expired:', isJobExpired(expiredJob)) // true

// Test with a job completed 10 hours ago (should have 38 hours left)
const recentJob = new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString()
console.log('Time remaining:', getTimeUntilExpiry(recentJob))
```

### Test Cleanup API:
```bash
# Check cleanup endpoint status
curl http://localhost:3002/api/v1/admin/cleanup

# Run cleanup (requires auth)
curl -X POST http://localhost:3002/api/v1/admin/cleanup \
  -H "Authorization: Bearer your_cleanup_key"
```

## 📈 Benefits

1. **Storage Management**: Automatically frees up disk space
2. **Cost Optimization**: Reduces storage costs over time
3. **User Experience**: Clear expiry notifications
4. **Analytics Preservation**: Maintains statistics and metrics
5. **Compliance**: Automatic data retention policy

## 🚨 Important Notes

- Files are **permanently deleted** after 48 hours
- Users should download files within the retention period
- Metadata and statistics are preserved indefinitely
- Cleanup runs automatically but can be triggered manually
- The system is designed to be safe and reversible (metadata preserved)

## 🔄 Migration Status

After running the SQL migration, the system will:
- ✅ Track file expiry status for all new jobs
- ✅ Show expiry information in the UI
- ✅ Enable automatic cleanup functionality
- ✅ Preserve all existing job data and statistics
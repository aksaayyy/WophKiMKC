-- 48-Hour File Retention System - Database Migration
-- Run this SQL in your Supabase dashboard (SQL Editor)

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

-- Verify the migration
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'video_jobs' 
AND column_name IN ('files_expired', 'files_expired_at');
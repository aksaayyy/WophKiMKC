-- Add file expiry tracking to video_jobs table
ALTER TABLE video_jobs 
ADD COLUMN IF NOT EXISTS files_expired BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS files_expired_at TIMESTAMPTZ;

-- Add index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_video_jobs_cleanup 
ON video_jobs (status, files_expired, completed_at) 
WHERE status = 'completed' AND files_expired = FALSE;

-- Add comment
COMMENT ON COLUMN video_jobs.files_expired IS 'Whether the video files have been deleted after 48 hours';
COMMENT ON COLUMN video_jobs.files_expired_at IS 'When the video files were deleted';
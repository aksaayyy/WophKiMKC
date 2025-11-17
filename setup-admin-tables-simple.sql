-- Simple Admin System Setup Script
-- Run this in your Supabase SQL editor

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  settings JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,
  CONSTRAINT single_settings_row CHECK (id = 1)
);

-- Admin activity log
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id VARCHAR(100),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System notifications table
CREATE TABLE IF NOT EXISTS system_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_user_id ON admin_activity_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action ON admin_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_system_notifications_created_at ON system_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_notifications_is_read ON system_notifications(is_read);

-- Enable RLS on admin tables
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policies using auth.users directly
-- Only users with admin in email can access system settings
DROP POLICY IF EXISTS "Admin access to system_settings" ON system_settings;
CREATE POLICY "Admin access to system_settings" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%admin%'
    )
  );

-- Only users with admin in email can access activity log
DROP POLICY IF EXISTS "Admin access to admin_activity_log" ON admin_activity_log;
CREATE POLICY "Admin access to admin_activity_log" ON admin_activity_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%admin%'
    )
  );

-- Only users with admin in email can access system notifications
DROP POLICY IF EXISTS "Admin access to system_notifications" ON system_notifications;
CREATE POLICY "Admin access to system_notifications" ON system_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%admin%'
    )
  );

-- Insert default system settings
INSERT INTO system_settings (id, settings) 
VALUES (1, '{
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
}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Create a test notification
INSERT INTO system_notifications (type, title, message, expires_at)
VALUES (
  'info',
  'Admin System Initialized',
  'The admin system has been successfully set up and is ready to use.',
  NOW() + INTERVAL '7 days'
);

-- Success message
SELECT 'Admin system tables created successfully! Create a user with email containing "admin" to access the admin panel.' as status;
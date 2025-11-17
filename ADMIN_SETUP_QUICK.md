# Quick Admin Setup Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Admin Tables
Copy and run this SQL in your Supabase SQL Editor:

```sql
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

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;

-- Admin access policies
CREATE POLICY "Admin access to system_settings" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%admin%'
    )
  );

CREATE POLICY "Admin access to admin_activity_log" ON admin_activity_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%admin%'
    )
  );

CREATE POLICY "Admin access to system_notifications" ON system_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%admin%'
    )
  );

-- Insert default settings
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
```

### Step 2: Create Admin User
1. Sign up for a new account with email containing "admin":
   - `admin@yourcompany.com`
   - `john.admin@company.com`
   - `admin@videoclipper.com`

### Step 3: Access Admin Panel
1. Login with your admin account
2. Navigate to `/admin`
3. You should see the admin dashboard!

## ✅ Verification

Test these features:
- [ ] Admin dashboard loads (`/admin`)
- [ ] User management works (`/admin/users`)
- [ ] Job management works (`/admin/jobs`)
- [ ] Settings page works (`/admin/settings`)
- [ ] Activity log works (`/admin/activity`)

## 🔧 Troubleshooting

### "Access Denied" Error
- Make sure your email contains "admin"
- Check that you're logged in
- Verify the RLS policies were created

### "Table doesn't exist" Error
- Run the SQL script above in Supabase SQL Editor
- Check that all tables were created successfully

### API Errors
- Check your environment variables in `.env.local`
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set correctly

## 🎯 What You Get

✅ **Complete Admin Dashboard** with analytics
✅ **User Management** - view, search, delete users  
✅ **Job Management** - monitor all video processing
✅ **System Settings** - configure limits and features
✅ **Activity Logging** - full audit trail
✅ **Security** - RLS policies and access control

That's it! Your admin system is ready to use. 🎉
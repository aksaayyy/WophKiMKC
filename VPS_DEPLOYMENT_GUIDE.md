# 🖥️ VPS Deployment Guide

## 🎯 **Complete VPS Deployment Strategy**

This guide covers deploying the entire Video Clipper Pro application on a VPS for maximum control and no limitations.

## 🛠️ **VPS Requirements**

### **Minimum Specifications**
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 100GB SSD
- **Bandwidth**: Unlimited
- **OS**: Ubuntu 22.04 LTS

### **Recommended Providers**
| Provider | Cost/Month | Specs | Notes |
|----------|------------|-------|-------|
| **DigitalOcean** | $48 | 4CPU, 8GB RAM | Easy setup, good docs |
| **Linode** | $40 | 4CPU, 8GB RAM | Reliable, fast |
| **Vultr** | $32 | 4CPU, 8GB RAM | Competitive pricing |
| **Hetzner** | $25 | 4CPU, 8GB RAM | Best value |

## 🚀 **Step-by-Step Deployment**

### **1. Server Setup (15 minutes)**

```bash
# Connect to your VPS
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git nginx certbot python3-certbot-nginx

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install Python 3.11
apt install -y python3.11 python3.11-pip python3.11-venv

# Install FFmpeg
apt install -y ffmpeg

# Install PM2 for process management
npm install -g pm2

# Install Docker (optional, for containerization)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### **2. Application Deployment (20 minutes)**

```bash
# Create application directory
mkdir -p /var/www/video-clipper-pro
cd /var/www/video-clipper-pro

# Clone your repository
git clone https://github.com/yourusername/video-clipper-pro.git .

# Install dependencies
npm install

# Set up Python environment for version2
cd version2
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Build the application
npm run build

# Create environment file
cp .env.example .env.local
# Edit .env.local with your production values
nano .env.local
```

### **3. Environment Configuration**

```bash
# Production environment variables
cat > .env.local << EOF
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App URLs
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com

# Authentication
NEXTAUTH_SECRET=your_production_secret
NEXTAUTH_URL=https://yourdomain.com

# Payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# UPI Payments
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_your_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# CLI Configuration
PYTHON_PATH=/var/www/video-clipper-pro/version2/venv/bin/python
CLI_TOOL_PATH=/var/www/video-clipper-pro/version2/enhanced_cli.py
CLI_WORKING_DIR=/var/www/video-clipper-pro/version2

# File Storage
UPLOAD_DIR=/var/www/video-clipper-pro/uploads
OUTPUT_DIR=/var/www/video-clipper-pro/public/processed
TEMP_DIR=/var/www/video-clipper-pro/temp
EOF
```

### **4. Nginx Configuration (10 minutes)**

```bash
# Create Nginx configuration
cat > /etc/nginx/sites-available/video-clipper-pro << 'EOF'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration (will be added by Certbot)
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # File upload size
    client_max_body_size 500M;
    
    # Proxy to Next.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Serve static files directly
    location /_next/static {
        alias /var/www/video-clipper-pro/.next/static;
        expires 365d;
        access_log off;
    }
    
    # Serve processed videos
    location /processed {
        alias /var/www/video-clipper-pro/public/processed;
        expires 7d;
        access_log off;
    }
}
EOF

# Enable the site
ln -s /etc/nginx/sites-available/video-clipper-pro /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

### **5. SSL Certificate (5 minutes)**

```bash
# Get SSL certificate from Let's Encrypt
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test automatic renewal
certbot renew --dry-run
```

### **6. Process Management (10 minutes)**

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'video-clipper-web',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/video-clipper-pro',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/video-clipper-web-error.log',
      out_file: '/var/log/pm2/video-clipper-web-out.log',
      log_file: '/var/log/pm2/video-clipper-web.log'
    },
    {
      name: 'video-processor',
      script: '/var/www/video-clipper-pro/version2/venv/bin/python',
      args: '/var/www/video-clipper-pro/version2/api_server.py',
      cwd: '/var/www/video-clipper-pro/version2',
      instances: 1,
      env: {
        PYTHONPATH: '/var/www/video-clipper-pro/version2'
      },
      error_file: '/var/log/pm2/video-processor-error.log',
      out_file: '/var/log/pm2/video-processor-out.log',
      log_file: '/var/log/pm2/video-processor.log'
    }
  ]
};
EOF

# Create log directory
mkdir -p /var/log/pm2

# Start applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
```

### **7. Database Setup (5 minutes)**

```bash
# Run database migrations
# This should be done in your Supabase dashboard
# Copy and execute the SQL from supabase/migrations/
```

### **8. File Permissions & Directories (5 minutes)**

```bash
# Create necessary directories
mkdir -p /var/www/video-clipper-pro/{uploads,temp,public/processed}

# Set proper permissions
chown -R www-data:www-data /var/www/video-clipper-pro
chmod -R 755 /var/www/video-clipper-pro
chmod -R 777 /var/www/video-clipper-pro/{uploads,temp,public/processed}

# Set up log rotation
cat > /etc/logrotate.d/video-clipper-pro << 'EOF'
/var/log/pm2/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

## 🔧 **Post-Deployment Configuration**

### **1. Monitoring Setup**

```bash
# Install monitoring tools
npm install -g pm2-logrotate
pm2 install pm2-server-monit

# Set up system monitoring
apt install -y htop iotop nethogs

# Create monitoring script
cat > /usr/local/bin/system-monitor.sh << 'EOF'
#!/bin/bash
echo "=== System Status $(date) ==="
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print $2 $3 $4}'
echo "Memory Usage:"
free -h
echo "Disk Usage:"
df -h /
echo "PM2 Status:"
pm2 status
echo "Nginx Status:"
systemctl status nginx --no-pager -l
EOF

chmod +x /usr/local/bin/system-monitor.sh
```

### **2. Backup Setup**

```bash
# Create backup script
cat > /usr/local/bin/backup-app.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/video-clipper-pro"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/video-clipper-pro \
    --exclude=/var/www/video-clipper-pro/node_modules \
    --exclude=/var/www/video-clipper-pro/.next \
    --exclude=/var/www/video-clipper-pro/uploads \
    --exclude=/var/www/video-clipper-pro/temp

# Backup processed files (last 7 days)
find /var/www/video-clipper-pro/public/processed -mtime -7 -type f | \
    tar -czf $BACKUP_DIR/processed_$DATE.tar.gz -T -

# Keep only last 7 backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /usr/local/bin/backup-app.sh

# Set up daily backup cron job
echo "0 2 * * * /usr/local/bin/backup-app.sh" | crontab -
```

### **3. Security Hardening**

```bash
# Install fail2ban
apt install -y fail2ban

# Configure fail2ban for Nginx
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true

[nginx-noscript]
enabled = true

[nginx-badbots]
enabled = true

[nginx-noproxy]
enabled = true
EOF

# Restart fail2ban
systemctl restart fail2ban

# Set up firewall
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable
```

## 🚀 **Deployment Commands Summary**

```bash
# Quick deployment script
#!/bin/bash
set -e

echo "🚀 Deploying Video Clipper Pro to VPS..."

# Pull latest changes
cd /var/www/video-clipper-pro
git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Update Python dependencies
cd version2
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Restart applications
pm2 restart all

# Reload Nginx
nginx -t && systemctl reload nginx

echo "✅ Deployment completed successfully!"
echo "🌐 Your application is live at: https://yourdomain.com"
```

## 📊 **Performance Optimization**

### **1. Caching Setup**

```bash
# Install Redis for caching
apt install -y redis-server

# Configure Redis
sed -i 's/# maxmemory <bytes>/maxmemory 1gb/' /etc/redis/redis.conf
sed -i 's/# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf

systemctl restart redis-server
```

### **2. Database Optimization**

```sql
-- Run these in Supabase SQL Editor
-- Create indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_video_jobs_user_id_status 
ON video_jobs(user_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_video_jobs_created_at 
ON video_jobs(created_at DESC);

-- Analyze tables
ANALYZE video_jobs;
ANALYZE user_subscriptions;
ANALYZE user_profiles;
```

## 🎯 **Final Checklist**

- [ ] VPS provisioned and configured
- [ ] Domain pointed to VPS IP
- [ ] SSL certificate installed
- [ ] Application deployed and running
- [ ] Database migrations executed
- [ ] Payment webhooks configured
- [ ] Monitoring and logging set up
- [ ] Backup system configured
- [ ] Security measures implemented
- [ ] Performance optimizations applied

## 🎉 **Success!**

Your Video Clipper Pro is now fully deployed on VPS with:
- ✅ No processing time limits
- ✅ Full control over resources
- ✅ Persistent file storage
- ✅ Background job processing
- ✅ Custom domain with SSL
- ✅ Monitoring and backups
- ✅ Production-grade security

**Total deployment time: ~90 minutes**
**Monthly cost: $25-50 (depending on VPS provider)**
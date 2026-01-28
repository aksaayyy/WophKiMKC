# VPS Deployment Instructions for Video Clipper

This document provides step-by-step instructions for deploying the Video Clipper backend to your VPS at IP address `185.255.94.116`.

## Prerequisites

1. SSH access to your VPS as root
2. The deployment package `version2_deploy.tar.gz` (already created)

## Deployment Steps

### 1. Initial System Setup

Run the complete VPS setup script on your VPS:

```bash
# SSH into your VPS as root
ssh root@185.255.94.116

# Download and run the setup script
wget https://raw.githubusercontent.com/your-repo/video-clipper/main/version2/complete_vps_setup.sh
chmod +x complete_vps_setup.sh
./complete_vps_setup.sh
```

Or manually run the commands from `/Users/rohitkumar/Documents/Woph_ki_maa_ki_ch*t/version2/complete_vps_setup.sh`.

### 2. Upload Deployment Package

From your local machine, upload the deployment package to your VPS:

```bash
scp /Users/rohitkumar/Documents/Woph_ki_maa_ki_ch*t/version2_deploy.tar.gz root@185.255.94.116:/root/
```

### 3. Extract and Set Up Application

On your VPS, extract the deployment package and set up the application:

```bash
# As root user
cd /home/videoclipper
tar -xzf /root/version2_deploy.tar.gz

# Change ownership
chown -R videoclipper:videoclipper version2

# Run Python setup as videoclipper user
sudo -u videoclipper /home/videoclipper/version2/vps_python_setup.sh
```

### 4. Configure Supervisor

On your VPS as root, run the Supervisor setup script:

```bash
/home/videoclipper/version2/setup_supervisor.sh
```

### 5. Configure Nginx

On your VPS as root, run the Nginx setup script:

```bash
/home/videoclipper/version2/setup_nginx.sh
```

### 6. Start Services

Start the application services:

```bash
# Start Supervisor and application
supervisorctl start videoclipper

# Check status
supervisorctl status videoclipper

# Start Nginx if not already running
systemctl start nginx
systemctl enable nginx
```

## Verification

Once deployment is complete, you should be able to access:

- Your application at: `http://185.255.94.116`
- API endpoints at: `http://185.255.94.116/api/`
- Health check at: `http://185.255.94.116/health`

## Frontend Deployment

For the frontend, run the Vercel deployment script from your local machine:

```bash
cd /Users/rohitkumar/Documents/Woph_ki_maa_ki_ch*t/video-clipper-pro
./deploy_to_vercel.sh
```

## Environment Configuration

After deployment, you may need to update the `.env` file on your VPS with proper values for:

- `SECRET_KEY` - Generate a secure random key
- `CORS_ORIGINS` - Set to your frontend domain
- Any other environment-specific variables

## Troubleshooting

### Common Issues

1. **Connection refused**: Ensure SSH is running and firewall rules allow connections
2. **Permission denied**: Ensure proper file ownership and permissions
3. **Service won't start**: Check logs in `/home/videoclipper/version2/logs/`

### Checking Logs

```bash
# Application logs
tail -f /home/videoclipper/version2/logs/supervisor_out.log
tail -f /home/videoclipper/version2/logs/supervisor_err.log

# Nginx logs
tail -f /var/log/nginx/videoclipper_access.log
tail -f /var/log/nginx/videoclipper_error.log
```

### Restarting Services

```bash
# Restart application
supervisorctl restart videoclipper

# Restart Nginx
systemctl restart nginx
```
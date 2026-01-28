# 🚀 Video Clipper Deployment Guide

This guide explains how to deploy the Video Clipper application with the frontend on Vercel and the backend on your VPS.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐
│    Vercel       │    │      VPS        │
│                 │    │                 │
│ • Frontend      │◄──►│ • Backend API   │
│ • Static Files  │    │ • Video Proc.   │
│ • Auth & Pay    │    │ • File Storage  │
└─────────────────┘    └─────────────────┘
```

## 📦 Prerequisites

### For VPS Deployment (Backend)
- Ubuntu 20.04/22.04 LTS server
- SSH access to the server
- Domain name (optional but recommended)

### For Vercel Deployment (Frontend)
- Vercel account
- Vercel CLI installed (`npm install -g vercel`)
- Node.js and npm installed locally

## 🚀 Deployment Steps

### 1. Backend Deployment (VPS)

```bash
# Deploy to your VPS
cd version2
./deploy_to_vps.sh YOUR_VPS_IP_OR_DOMAIN

# Example:
./deploy_to_vps.sh 192.168.1.100
./deploy_to_vps.sh your-domain.com 2222  # with custom SSH port
```

The script will:
- Package and upload the backend code
- Set up Python virtual environment
- Install all dependencies
- Configure Supervisor for process management
- Set up Nginx as reverse proxy
- Create necessary directories and environment files

### 2. Frontend Deployment (Vercel)

```bash
# Deploy to Vercel
cd video-clipper-pro
./deploy_to_vercel.sh

# For production deployment:
./deploy_to_vercel.sh --prod
```

The script will:
- Test the build locally
- Initialize Git repository if needed
- Deploy to Vercel
- Provide instructions for post-deployment configuration

## ⚙️ Post-Deployment Configuration

### Backend Configuration
1. Set up your domain DNS to point to your VPS IP
2. Configure SSL with Let's Encrypt:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```
3. Set up firewall:
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

### Frontend Configuration
1. Update environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_API_URL` - Your VPS domain/IP with HTTPS
   - `EXTERNAL_PROCESSING_URL` - Your VPS domain/IP with HTTPS
   - Database and authentication keys
2. Add your custom domain in Vercel settings
3. Configure webhook endpoints for payment processing

## 🔧 Monitoring and Maintenance

### Backend
- Check application status: `sudo supervisorctl status`
- View logs: `tail -f /home/videoclipper/version2/logs/supervisor_err.log`
- Restart service: `sudo supervisorctl restart videoclipper`

### Frontend
- Monitor in Vercel dashboard
- Check analytics and performance metrics
- View deployment logs

## 🆘 Troubleshooting

### Backend Issues
- If the application fails to start, check Supervisor logs
- If Nginx shows errors, verify the configuration with `nginx -t`
- For memory issues, reduce the number of Gunicorn workers

### Frontend Issues
- Check Vercel logs for build errors
- Verify environment variables are correctly set
- Ensure API endpoints are accessible from the frontend

## 🎉 Success

Once deployed, your Video Clipper application will be available at:
- Frontend: `https://your-vercel-domain.vercel.app`
- Backend API: `https://your-vps-domain.com/api/`

Users can upload videos through the frontend, which will be processed by the backend on your VPS!
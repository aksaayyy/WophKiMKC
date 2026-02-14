# 🚀 HookClip VPS Deployment - Complete Package

## What We Created for Your VPS

---

## 📦 Files Created

### 1. Core Deployment Files

| File | Purpose |
|------|---------|
| `vps-deploy.sh` | **One-command VPS deployment** |
| `docker-compose.vps.yml` | Production Docker setup |
| `nginx/nginx.conf` | Reverse proxy with SSL |
| `server/Dockerfile.prod` | Optimized server image |
| `web/Dockerfile.prod` | Optimized web image |
| `server/.env.vps` | Production environment template |

### 2. Cloud Deployment Configs

| File | Platform |
|------|----------|
| `render.yaml` | Render.com |
| `fly.toml` | Fly.io |
| `railway.json` | Railway.app |
| `docker-compose.prod.yml` | Generic Docker |

### 3. Mobile App Files

| File | Purpose |
|------|---------|
| `mobile/.env.production` | Mobile app API config |
| `mobile/build-android.sh` | Android build script |
| `mobile/build-ios.sh` | iOS build script |
| `mobile/ANDROID_SETUP.md` | Android setup guide |
| `mobile-serve.sh` | Local mobile web server |
| `build-mobile-apps.sh` | **Build all mobile apps** |

### 4. Documentation

| File | Description |
|------|-------------|
| `VPS_DEPLOY.md` | **Complete VPS deployment guide** |
| `DEPLOY.md` | General deployment options |
| `QUICK_DEPLOY.md` | Quick start guide |
| `MOBILE_WEB.md` | Mobile web setup |
| `VPS_SUMMARY.md` | This file |

---

## 🎯 Quick Start Commands

### Deploy to Your VPS (SSH into server)

```bash
# Download and run
wget https://raw.githubusercontent.com/yourusername/hookclip/main/vps-deploy.sh
chmod +x vps-deploy.sh

# With domain (recommended)
./vps-deploy.sh your-domain.com your-email@example.com

# Without domain (IP only)
./vps-deploy.sh
```

### Build Mobile Apps (On your local machine)

```bash
# Build Android APK + Web
./build-mobile-apps.sh your-domain.com

# Output:
# - web/public/downloads/hookclip-android.apk
# - web/public/download.html (app store page)
```

---

## 📱 Mobile Support

### 1. Mobile Web App (Instant)

**URL:** `https://your-domain.com/mobile.html`

- ✅ Works on all phones
- ✅ No installation needed
- ✅ Same features as desktop
- ✅ Auto-detects your VPS API

### 2. Android Native App

**Download:** `https://your-domain.com/downloads/hookclip-android.apk`

Build command:
```bash
./build-mobile-apps.sh your-domain.com
# Select option 1 (All)
```

### 3. iOS Native App

Build locally with Xcode:
```bash
cd mobile
npx expo prebuild --platform ios
# Open ios/HookClip.xcworkspace in Xcode
```

---

## 🔐 SSL/HTTPS Setup

### Automatic (Let's Encrypt)

When you provide a domain to `vps-deploy.sh`:
- ✅ Auto-generates SSL certificate
- ✅ Auto-renews every 90 days
- ✅ HTTPS enabled for all services

### Manual SSL

```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy to nginx
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
```

---

## 🌐 Architecture

```
User → Nginx (443) → [Web App (3000) / API (3001)]
                              ↓
                         Redis
                              ↓
                    Video Processing
```

**Ports:**
- `80` → HTTP redirect to HTTPS
- `443` → Main application (Nginx)
- `3000` → Web app (internal)
- `3001` → API server (internal)

---

## 🛠️ Management Commands

```bash
# View all containers
docker-compose -f docker-compose.vps.yml ps

# View logs
docker-compose -f docker-compose.vps.yml logs -f

# Restart
docker-compose -f docker-compose.vps.yml restart

# Update
docker-compose -f docker-compose.vps.yml pull
docker-compose -f docker-compose.vps.yml up -d

# Stop
docker-compose -f docker-compose.vps.yml down

# Backup
tar -czf backup-$(date +%Y%m%d).tar.gz data/
```

---

## 📊 Resource Usage

| Service | RAM | CPU | Disk |
|---------|-----|-----|------|
| Nginx | 50MB | 0.1 | 10MB |
| Web | 100MB | 0.2 | 50MB |
| API | 500MB | 1.0 | 100MB |
| Redis | 50MB | 0.1 | 10MB |
| **Total** | **~700MB** | **~1.5** | **~200MB** |

**Recommended VPS:** 2GB RAM, 1 CPU, 20GB SSD

---

## 🌍 Domain Setup

### 1. Buy Domain (Namecheap, Cloudflare, etc.)

### 2. Point to VPS

Add A record:
```
Type: A
Name: @
Value: your-vps-ip
TTL: Auto
```

### 3. Deploy with Domain

```bash
./vps-deploy.sh your-domain.com your@email.com
```

### 4. Wait for DNS (5-60 min)

Check: `https://your-domain.com`

---

## 🎯 User Flow

### Mobile Web Users
1. Visit `https://your-domain.com/mobile.html`
2. Paste YouTube URL
3. Configure options
4. Generate clips
5. Download videos

### Android App Users
1. Visit `https://your-domain.com/download.html`
2. Download APK
3. Install (enable "Unknown sources")
4. Open app
5. Same flow as web

### iOS Users
1. Visit mobile web version
2. Add to Home Screen
3. Use like native app

---

## 💰 Cost Breakdown

| Component | Monthly Cost |
|-----------|--------------|
| VPS (2GB) | $6-12 |
| Domain | $1-10/year |
| SSL (Let's Encrypt) | FREE |
| **Total** | **~$6-12/month** |

---

## 🚨 Troubleshooting

### "Cannot connect to API"
```bash
# Check API is running
curl https://your-domain.com/api/health

# Check logs
docker-compose -f docker-compose.vps.yml logs server
```

### "SSL certificate error"
```bash
# Check cert
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Regenerate
./vps-deploy.sh your-domain.com your@email.com
```

### "Out of memory"
```bash
# Add swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 📈 Scaling Up

### More Users?
- Upgrade VPS to 4GB RAM
- Enable CDN (Cloudflare)
- Use S3 for video storage

### Global Users?
- Deploy to multiple regions (Fly.io)
- Use CDN for videos
- Enable caching

---

## 🎉 Next Steps

1. **Get a VPS** (DigitalOcean, Linode, Hetzner)
2. **Buy a domain** (optional but recommended)
3. **Run deploy script** on VPS
4. **Build mobile apps** locally
5. **Share with users!**

---

## 📞 Support Commands

```bash
# Health check
curl https://your-domain.com/api/health

# Server stats
docker stats

# Disk usage
df -h

# Restart everything
docker-compose -f docker-compose.vps.yml restart
```

---

**Your HookClip instance is ready to serve users worldwide!** 🚀

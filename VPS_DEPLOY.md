# Deploy HookClip on Your VPS

Complete guide for deploying HookClip with mobile web and native app support.

---

## 📋 Requirements

- VPS with **2GB RAM minimum** (4GB recommended)
- **20GB disk space**
- **Ubuntu 20.04+ / Debian 11+**
- Domain name (optional but recommended)

---

## 🚀 Quick Deploy (5 minutes)

### Step 1: Connect to Your VPS

```bash
ssh root@your-vps-ip
```

### Step 2: Download and Run Deploy Script

```bash
# Create a user (recommended)
adduser hookclip
usermod -aG sudo hookclip
su - hookclip

# Download HookClip
cd ~
git clone https://github.com/yourusername/hookclip.git
cd hookclip

# Deploy with domain (recommended)
./vps-deploy.sh your-domain.com your-email@example.com

# Or deploy with IP only (self-signed SSL)
./vps-deploy.sh
```

### Step 3: Done! 🎉

Access your HookClip:
- **Web App**: `https://your-domain.com`
- **Mobile Web**: `https://your-domain.com/mobile.html`
- **API**: `https://your-domain.com/api`

---

## 📱 Mobile Setup

### Mobile Web (Instant)

Users can access immediately at:
```
https://your-domain.com/mobile.html
```

### Native App Build

#### 1. Update API Configuration

Edit `mobile/.env.production`:
```env
API_BASE_URL=https://your-domain.com/api
```

#### 2. Build Android APK

On your local machine:
```bash
cd mobile

# Install dependencies
npm install

# Configure for your VPS
cp .env.production .env

# Build release APK
npx expo prebuild --platform android
cd android
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

#### 3. Build iOS App

Requires Mac with Xcode:
```bash
cd mobile
npx expo prebuild --platform ios
cd ios
xcodebuild -workspace HookClip.xcworkspace -scheme HookClip -configuration Release
```

#### 4. Distribute App

**Android:**
- Upload APK to Google Play Console
- Or distribute directly (sideload)

**iOS:**
- Upload to App Store Connect
- Or use TestFlight for beta testing

---

## 🔒 SSL Certificate Setup

### Option A: Let's Encrypt (Free, Auto-Renew)

Already handled by deploy script if you provide domain.

Manual setup:
```bash
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com

# Copy certs
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem

# Auto-renewal
sudo certbot renew --dry-run
```

### Option B: Cloudflare (Free, Easy)

1. Point your domain to Cloudflare
2. Enable "Full (Strict)" SSL mode
3. Use Cloudflare's origin certificates

### Option C: Self-Signed (Development only)

Deploy script generates this automatically when no domain provided.

---

## 🔧 Configuration

### Environment Variables

Edit `server/.env`:

```env
# Required
FRONTEND_URL=https://your-domain.com
ADMIN_PASSWORD=your_secure_password

# Optional - YouTube Upload
YOUTUBE_CLIENT_ID=xxx
YOUTUBE_CLIENT_SECRET=xxx
YOUTUBE_REFRESH_TOKENS=token1,token2

# Optional - Smart Detection
LLM_API_KEY=sk-xxx
```

### Resource Limits

Edit `docker-compose.vps.yml` to adjust:

```yaml
deploy:
  resources:
    limits:
      cpus: '2'      # CPU cores
      memory: 2G     # RAM limit
```

---

## 📊 Monitoring & Maintenance

### View Logs

```bash
# All services
docker-compose -f docker-compose.vps.yml logs -f

# Specific service
docker-compose -f docker-compose.vps.yml logs -f server
docker-compose -f docker-compose.vps.yml logs -f nginx
```

### Update to Latest Version

```bash
cd ~/hookclip
git pull
docker-compose -f docker-compose.vps.yml pull
docker-compose -f docker-compose.vps.yml up -d
```

### Backup Data

```bash
# Backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
mkdir -p backups
tar -czf backups/hookclip-$DATE.tar.gz data/
```

### Check Disk Space

```bash
df -h
docker system df

# Clean up if needed
docker system prune -a
```

### Restart Services

```bash
docker-compose -f docker-compose.vps.yml restart

# Or specific service
docker-compose -f docker-compose.vps.yml restart server
```

---

## 🔥 Troubleshooting

### "Cannot connect to server"

```bash
# Check if containers are running
docker-compose -f docker-compose.vps.yml ps

# Check logs
docker-compose -f docker-compose.vps.yml logs server

# Test API locally
curl http://localhost:3001/api/health
```

### "SSL certificate error"

```bash
# Check certificate
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Regenerate self-signed
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/key.pem \
    -out nginx/ssl/cert.pem \
    -subj "/CN=your-domain.com"
```

### "Out of memory"

```bash
# Add swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Or upgrade VPS plan
```

### "Videos not processing"

```bash
# Check FFmpeg
docker-compose -f docker-compose.vps.yml exec server ffmpeg -version

# Check disk space
df -h

# Check yt-dlp
docker-compose -f docker-compose.vps.yml exec server yt-dlp --version
```

---

## 🌐 Domain Setup

### Point Domain to VPS

1. Go to your domain registrar
2. Add A record:
   - Name: `@` or `hookclip`
   - Value: `your-vps-ip`
3. Wait for DNS propagation (5-60 minutes)

### Cloudflare (Recommended)

1. Add site to Cloudflare
2. Change nameservers
3. Create A record pointing to VPS IP
4. Enable "Always Use HTTPS"
5. Set SSL/TLS to "Full (Strict)"

---

## 📱 Mobile App Distribution

### Android

#### Direct Download (Sideload)
```bash
# Users download APK from your site
# Place APK in web/public/
cp mobile/android/app/build/outputs/apk/release/app-release.apk web/public/hookclip.apk
```

#### Google Play Store
1. Create Google Play Developer account ($25)
2. Build signed APK/AAB
3. Upload to Play Console
4. Fill store listing
5. Publish

### iOS

#### TestFlight (Beta)
1. Apple Developer account ($99/year)
2. Archive app in Xcode
3. Upload to App Store Connect
4. Add testers via TestFlight

#### App Store
1. Create app record in App Store Connect
2. Fill app information
3. Submit for review
4. Publish

---

## 🔐 Security Checklist

- [ ] Change default admin password
- [ ] Use strong passwords in .env
- [ ] Enable UFW firewall
- [ ] Set up SSL/HTTPS
- [ ] Regular security updates
- [ ] Disable root SSH login
- [ ] Use SSH keys only
- [ ] Set up fail2ban

```bash
# Install fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

---

## 💰 Cost Optimization

### Reduce Costs

1. **Use Cloudflare R2** for video storage ($0.015/GB)
2. **Enable CDN** for faster global access
3. **Auto-cleanup** old videos after 24h
4. **Compress videos** more aggressively

### Monitoring

```bash
# Install monitoring (optional)
docker run -d \
  --name=netdata \
  -p 19999:19999 \
  -v /proc:/host/proc:ro \
  -v /sys:/host/sys:ro \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  netdata/netdata
```

Access at `http://your-vps:19999`

---

## 🆘 Support

Need help?

```bash
# Check all service status
docker-compose -f docker-compose.vps.yml ps

# Get full logs
docker-compose -f docker-compose.vps.yml logs > logs.txt

# Check system resources
htop
df -h
docker stats
```

---

**Your HookClip instance is ready for users worldwide!** 🚀

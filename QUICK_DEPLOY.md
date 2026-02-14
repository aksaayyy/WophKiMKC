# Quick Deploy HookClip

## Easiest Option: Docker on VPS ($6-12/month)

### 1. Get a Server
- **DigitalOcean**: $6/month droplet
- **Linode**: $5/month nanode
- **Hetzner**: €4.51/month
- Any VPS with 2GB+ RAM

### 2. Setup (5 minutes)

```bash
# SSH into your server
ssh root@your-server-ip

# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone HookClip
git clone https://github.com/yourusername/hookclip.git
cd hookclip

# Configure
cp server/.env.example server/.env
nano server/.env  # Edit your settings

# Deploy
./deploy.sh docker
```

### 3. Access
- Web: `http://your-server-ip:3000`
- API: `http://your-server-ip:3001`

---

## Free Option: Render.com

### 1. Fork this repo to your GitHub

### 2. Go to [render.com](https://render.com)

### 3. Click "New +" → "Blueprint"

### 4. Connect your GitHub repo

### 5. Render will auto-deploy:
- Redis (free)
- Backend API (standard plan ~$7/month)
- Frontend (free)

### 6. Done! You'll get URLs like:
- `https://hookclip-web.onrender.com`
- `https://hookclip-api.onrender.com`

---

## Free for Testing: Local Tunnel

Want to share your local instance temporarily?

```bash
# Install ngrok
npm install -g ngrok

# Start your local HookClip
./start.sh start

# Create tunnel
ngrok http 4000

# Share the https URL with anyone!
```

---

## What Users Will See

1. **Home Page**: Paste YouTube URL
2. **Options**: Select platform, clips, duration
3. **Progress**: Real-time processing status
4. **Clips**: Download generated videos

---

## Custom Domain (Optional)

### With Nginx + SSL

```bash
# Install certbot
apt install certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d yourdomain.com

# Auto-renews forever
```

---

## Cost Comparison

| Users | Recommended | Monthly Cost |
|-------|-------------|--------------|
| Just you | Local | Free |
| 1-10 | Render Free + API Starter | $7 |
| 10-100 | DigitalOcean 2GB | $12 |
| 100+ | DigitalOcean 4GB + CDN | $24+ |

---

## Need Help?

```bash
# Check if running
./deploy.sh status

# View logs
./deploy.sh logs

# Update to latest
git pull
./deploy.sh update

# Full docs
cat DEPLOY.md
```

---

## One-Command Deploy (Advanced)

```bash
# This script does everything
curl -fsSL https://raw.githubusercontent.com/yourusername/hookclip/main/install.sh | bash
```

Create `install.sh` for truly one-click installs.

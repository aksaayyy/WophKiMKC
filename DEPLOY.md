# Deploy HookClip to Production

## Option 1: Docker Compose (Self-Hosted) ⭐ Recommended

### Prerequisites
- Server with 4GB+ RAM
- Docker & Docker Compose installed
- Domain name (optional but recommended)

### Quick Deploy

```bash
# 1. Clone and setup
git clone <your-repo>
cd hookclip
cp .env.example .env

# 2. Edit production environment
nano .env
```

Edit `.env`:
```env
# Server
PORT=3001
FRONTEND_URL=https://your-domain.com

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# YouTube OAuth (optional - for upload feature)
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_secret
YOUTUBE_REDIRECT_URI=https://your-domain.com/api/oauth/callback
YOUTUBE_REFRESH_TOKENS=token1,token2

# LLM (optional - for smart detection)
LLM_PROVIDER=openai
LLM_API_KEY=sk-...

# Admin
ADMIN_PASSWORD=your_secure_password

# Paths (Docker volumes)
DOWNLOAD_DIR=/app/downloads
OUTPUT_DIR=/app/output
LOG_DIR=/app/logs
```

```bash
# 3. Deploy
docker-compose -f docker-compose.prod.yml up -d

# 4. Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

Access at `http://your-server-ip:3000`

---

## Option 2: Render.com (Free Tier Available)

### 1. Create Render Account
Go to [render.com](https://render.com) and sign up

### 2. Deploy Redis
- Create New → Redis
- Name: `hookclip-redis`
- Plan: Free (or Starter for production)
- Copy the "Internal Redis URL"

### 3. Deploy Backend
- Create New → Web Service
- Connect your GitHub repo
- Settings:
  - **Name**: `hookclip-api`
  - **Environment**: Node
  - **Build Command**: `cd server && npm install`
  - **Start Command**: `cd server && npm start`
  - **Plan**: Standard ($7/month minimum for video processing)

- Add Environment Variables:
```
PORT=10000
FRONTEND_URL=https://hookclip-web.onrender.com
REDIS_HOST=red-xxxxxxxxxxxxxxxxxxxx:6379
NODE_ENV=production
YOUTUBE_CLIENT_ID=(optional)
YOUTUBE_CLIENT_SECRET=(optional)
YOUTUBE_REFRESH_TOKENS=(optional)
LLM_API_KEY=(optional)
ADMIN_PASSWORD=your_password
```

### 4. Deploy Frontend
- Create New → Static Site
- Connect your GitHub repo
- Settings:
  - **Name**: `hookclip-web`
  - **Build Command**: `cd web && npm install && npm run build`
  - **Publish Directory**: `web/dist` or `web/.next`
  - **Plan**: Free

- Add Environment Variable:
```
NEXT_PUBLIC_API_URL=https://hookclip-api.onrender.com/api
```

---

## Option 3: Railway.app (Easy & Fast)

### 1. Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init
```

### 2. Deploy Services
```bash
# Add Redis
railway add --database redis

# Deploy backend
cd server
railway up

# Deploy frontend
cd ../web
railway up
```

### 3. Configure Domain
```bash
railway domain
```

---

## Option 4: DigitalOcean Droplet ($6/month)

### 1. Create Droplet
- Image: Docker on Ubuntu 22.04
- Plan: Basic, 2GB RAM / 1 CPU ($12/month recommended for video)
- Datacenter: Closest to your users

### 2. Setup
```bash
# SSH into server
ssh root@your-droplet-ip

# Clone repo
git clone <your-repo>
cd hookclip

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Add SSL with Nginx
```bash
# Install nginx and certbot
apt update
apt install -y nginx certbot python3-certbot-nginx

# Create nginx config
cat > /etc/nginx/sites-available/hookclip << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        client_max_body_size 500M;
    }
}
EOF

ln -s /etc/nginx/sites-available/hookclip /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Get SSL
certbot --nginx -d your-domain.com
```

---

## Option 5: Fly.io (Global Edge Network)

### 1. Install Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
```

### 2. Deploy
```bash
# Login
fly auth login

# Create app
fly apps create hookclip

# Launch
cd server
fly launch

# Add Redis
fly redis create

# Deploy
fly deploy
```

---

## Post-Deployment Checklist

### Essential
- [ ] Test video processing with a YouTube URL
- [ ] Check Redis connection
- [ ] Verify FFmpeg is working
- [ ] Set up monitoring/alerts
- [ ] Configure backups for Redis

### Security
- [ ] Change default admin password
- [ ] Set up firewall rules (only 80/443 open)
- [ ] Enable rate limiting
- [ ] Add HTTPS/SSL
- [ ] Regular security updates

### Performance
- [ ] Set up CDN for video files (Cloudflare R2, AWS S3)
- [ ] Configure auto-scaling if needed
- [ ] Monitor disk space (videos take space!)
- [ ] Set up log rotation

---

## Cost Estimates

| Platform | Monthly Cost | Best For |
|----------|--------------|----------|
| Self-hosted (VPS) | $6-20 | Tech-savvy, full control |
| Render | $7-25 | Easy setup, auto-deploy |
| Railway | $5-20 | Simple, good DX |
| Fly.io | $5-15 | Global edge, fast |
| DigitalOcean | $12-24 | Reliable, good docs |

---

## Troubleshooting

### "Redis connection refused"
- Check REDIS_HOST points to correct service
- Verify Redis is running: `docker-compose ps`

### "FFmpeg not found"
- Ensure FFmpeg is installed in container
- Check Dockerfile includes `apt-get install ffmpeg`

### Videos not processing
- Check disk space: `df -h`
- Check logs: `docker-compose logs -f server`
- Verify yt-dlp is working

### "Out of memory"
- Upgrade to larger plan
- Reduce WORKER_CONCURRENCY in .env
- Add swap space

---

## Next Steps

1. **Set up custom domain** - Point DNS to your server
2. **Configure email** - For notifications
3. **Add analytics** - Track usage
4. **Set up monitoring** - Uptime alerts
5. **Create admin panel** - Manage jobs

Need help? Check the logs: `docker-compose logs -f`

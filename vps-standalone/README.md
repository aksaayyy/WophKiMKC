# 🎬 Video Clipper - VPS Standalone

A lightweight, self-contained video processing server. No external databases required.

## Features

- ✅ Upload videos and process into clips
- ✅ YouTube URL processing (download + clip)
- ✅ Multiple platform formats (TikTok, Instagram, YouTube, Twitter)
- ✅ Quality presets (standard, high, premium)
- ✅ Job tracking with local JSON storage
- ✅ RESTful API

## Requirements

- Python 3.8+
- FFmpeg
- ~2GB RAM minimum
- Storage for videos

## Quick Start

```bash
# 1. Clone/copy files to your VPS
cd vps-standalone

# 2. Run setup
chmod +x setup.sh
./setup.sh

# 3. Start server
source venv/bin/activate
python server.py
```

## API Endpoints

### Health Check
```bash
curl http://localhost:5000/
```

### Upload Video
```bash
curl -X POST http://localhost:5000/api/upload \
  -F "file=@video.mp4"
```

Response:
```json
{
  "success": true,
  "file_id": "abc123",
  "filename": "abc123_video.mp4",
  "filepath": "uploads/abc123_video.mp4"
}
```

### Process Video
```bash
curl -X POST http://localhost:5000/api/process \
  -H "Content-Type: application/json" \
  -d '{
    "filepath": "uploads/abc123_video.mp4",
    "clips": 3,
    "platform": "instagram",
    "quality": "high"
  }'
```

Response:
```json
{
  "success": true,
  "job_id": "uuid-here",
  "status_url": "/api/status/uuid-here"
}
```

### Check Status
```bash
curl http://localhost:5000/api/status/{job_id}
```

Response:
```json
{
  "id": "uuid-here",
  "status": "completed",
  "progress": 100,
  "output_files": [
    {"filename": "clip_1_instagram.mp4", "url": "/api/download/..."}
  ]
}
```

### Process YouTube URL
```bash
curl -X POST http://localhost:5000/api/youtube \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://youtube.com/watch?v=...",
    "clips": 3,
    "platform": "tiktok"
  }'
```

### Download Clip
```bash
curl -O http://localhost:5000/api/download/{job_id}/{filename}
```

### List Jobs
```bash
curl http://localhost:5000/api/jobs
```

## Processing Options

| Option | Values | Default | Description |
|--------|--------|---------|-------------|
| clips | 1-10 | 3 | Number of clips to generate |
| platform | instagram, tiktok, youtube, twitter | instagram | Target platform (affects aspect ratio) |
| quality | standard, high, premium | high | Output quality |
| min_duration | 5-120 | 15 | Minimum clip duration (seconds) |
| max_duration | 10-300 | 60 | Maximum clip duration (seconds) |
| enhance_audio | true/false | false | Audio enhancement |
| smart_selection | true/false | false | AI-based clip selection |

## Platform Formats

| Platform | Aspect Ratio | Resolution |
|----------|--------------|------------|
| Instagram/TikTok/Reels | 9:16 | 1080x1920 |
| YouTube | 16:9 | 1920x1080 |
| Twitter | 1:1 | 1080x1080 |

## Production Deployment

### Using systemd

```bash
# Copy service file
sudo cp videoclipper.service /etc/systemd/system/

# Edit paths in service file
sudo nano /etc/systemd/system/videoclipper.service

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable videoclipper
sudo systemctl start videoclipper

# Check status
sudo systemctl status videoclipper
```

### Using nginx (HTTPS)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 500M;
    }
}
```

### Using PM2

```bash
pm2 start "python server.py" --name videoclipper
pm2 save
pm2 startup
```

## Storage Management

Jobs and files are stored locally:
- `uploads/` - Uploaded videos
- `output/` - Processed clips
- `jobs.json` - Job tracking

Add a cron job to clean old files:
```bash
# Clean files older than 7 days
0 0 * * * find /path/to/uploads -mtime +7 -delete
0 0 * * * find /path/to/output -mtime +7 -type d -exec rm -rf {} +
```

## Troubleshooting

### FFmpeg not found
```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# CentOS/RHEL
sudo yum install ffmpeg

# macOS
brew install ffmpeg
```

### Permission denied
```bash
chmod +x server.py process_video.py
```

### Port already in use
```bash
# Find process using port 5000
lsof -i :5000

# Kill it or use different port
python server.py --port 5001
```

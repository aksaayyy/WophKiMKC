# HookClip

Generate engaging hook clips from YouTube videos. Paste a YouTube URL, configure clip options, and get vertical clips optimized for Shorts/Reels/TikTok.

## Features

- Smart hook detection using audio energy analysis
- 1080x1920 vertical clips (9:16) with H.264 encoding
- Optional auto-upload to YouTube Shorts (multi-account round-robin)
- Clean web UI with real-time processing status

## Quick Start

### Prerequisites

- Node.js 20+
- Redis
- FFmpeg
- yt-dlp

### One-Command Start

```bash
./start.sh start    # Start all services
./start.sh stop     # Stop all services
./start.sh status   # Check service status
./start.sh logs     # View logs
./start.sh dev      # Dev mode with visible logs
```

Open http://localhost:4000

### Manual Setup

```bash
# Backend
cd server
cp .env.example .env
npm install
npm run dev

# Frontend (new terminal)
cd web
npm install
npm run dev
```

### YouTube Upload (Optional)

```bash
cd server
npm run setup:oauth
```

Follow the prompts to get a YouTube refresh token, then add it to `server/.env`.

## Architecture

```
server/          Node.js + Express + BullMQ
  services/      yt-dlp downloader, FFmpeg clipper, hook detector, YouTube uploader
  workers/       BullMQ job queue (download → analyze → clip → upload)
  routes/        REST API endpoints

web/             Next.js 14 + TypeScript + Tailwind
  Single page    URL input → options → processing status → download/upload
```

## Docker

```bash
docker-compose up
```

## Deployment

Deploy HookClip for users to access:

### Option 1: Docker Compose (Self-Hosted) ⭐

```bash
# Setup
./deploy.sh docker

# Or manually:
docker-compose -f docker-compose.prod.yml up -d
```

Access at `http://your-server-ip:3000`

### Option 2: Render.com (One-Click)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/yourusername/hookclip)

### Option 3: Railway / Fly.io

See [DEPLOY.md](DEPLOY.md) for detailed instructions.

---

## Mobile App

### Mobile Web (No Install)

```bash
./start.sh mobile-web
# Open on phone: http://your-server:4001/mobile.html
```

### Native Apps

```bash
./start.sh ios      # iOS Simulator
./start.sh android  # Android USB device
```

See [DEPLOY.md](DEPLOY.md) for production deployment.

const { Router } = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const Redis = require('ioredis');
const config = require('../config');

const execAsync = promisify(exec);
const router = Router();

router.get('/', async (req, res) => {
  const health = { status: 'ok', checks: {} };

  // Redis
  try {
    const redis = new Redis({ host: config.redis.host, port: config.redis.port, lazyConnect: true });
    await redis.connect();
    await redis.ping();
    health.checks.redis = 'connected';
    redis.disconnect();
  } catch {
    health.checks.redis = 'disconnected';
    health.status = 'degraded';
  }

  // FFmpeg
  try {
    const { stdout } = await execAsync('ffmpeg -version | head -1');
    health.checks.ffmpeg = stdout.trim().split('\n')[0];
  } catch {
    health.checks.ffmpeg = 'not found';
    health.status = 'degraded';
  }

  // yt-dlp
  try {
    const { stdout } = await execAsync('yt-dlp --version');
    health.checks.ytdlp = stdout.trim();
  } catch {
    health.checks.ytdlp = 'not found';
    health.status = 'degraded';
  }

  // aria2c
  try {
    const { stdout } = await execAsync('aria2c --version');
    health.checks.aria2c = stdout.trim().split('\n')[0];
  } catch {
    health.checks.aria2c = 'not found';
  }

  // faster-whisper
  try {
    const { stdout } = await execAsync('python3 -c "import faster_whisper; print(faster_whisper.__version__)"');
    health.checks.fasterWhisper = stdout.trim();
  } catch {
    health.checks.fasterWhisper = 'not found';
  }

  // mediapipe
  try {
    const { stdout } = await execAsync('python3 -c "import mediapipe; print(mediapipe.__version__)"');
    health.checks.mediapipe = stdout.trim();
  } catch {
    health.checks.mediapipe = 'not found';
  }

  res.json(health);
});

module.exports = router;

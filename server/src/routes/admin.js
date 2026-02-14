const { Router } = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');
const { queue } = require('../workers/clip-worker');
const { sweepOldFiles } = require('../utils/cleanup');
const config = require('../config');
const logger = require('../utils/logger');

const execAsync = promisify(exec);
const router = Router();

// ---------------------------------------------------------------------------
// Helper: recursively compute directory size in bytes
// ---------------------------------------------------------------------------
function getDirSize(dirPath) {
  let size = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        size += getDirSize(full);
      } else {
        try { size += fs.statSync(full).size; } catch {}
      }
    }
  } catch {}
  return size;
}

// ---------------------------------------------------------------------------
// Auth middleware – validate x-admin-key header
// ---------------------------------------------------------------------------
router.use((req, res, next) => {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return res.status(503).json({ error: 'Admin API is not configured' });
  }

  const key = req.headers['x-admin-key'];
  if (key !== adminPassword) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
});

// ---------------------------------------------------------------------------
// GET /stats
// ---------------------------------------------------------------------------
router.get('/stats', async (req, res, next) => {
  try {
    const counts = await queue.getJobCounts('completed', 'failed', 'active', 'waiting', 'delayed');
    const completedJobs = await queue.getCompleted(0, 100);
    const failedJobs = await queue.getFailed(0, 100);

    // Jobs created today
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const todayTs = todayMidnight.getTime();

    const jobsToday = [...completedJobs, ...failedJobs].filter(
      (job) => job.timestamp >= todayTs
    ).length;

    // Average processing time (seconds) from completed jobs that have completedAt
    let avgProcessingTime = 0;
    const timings = completedJobs
      .filter((job) => job.data.completedAt)
      .map((job) => {
        const completedAt = new Date(job.data.completedAt).getTime();
        return (completedAt - job.timestamp) / 1000;
      });

    if (timings.length > 0) {
      avgProcessingTime = timings.reduce((sum, t) => sum + t, 0) / timings.length;
    }

    // Disk usage
    const downloadsDir = path.resolve(config.paths.downloads);
    const outputDir = path.resolve(config.paths.output);
    const downloadsSize = getDirSize(downloadsDir);
    const outputSize = getDirSize(outputDir);

    res.json({
      total: (counts.completed || 0) + (counts.failed || 0) + (counts.active || 0) + (counts.waiting || 0) + (counts.delayed || 0),
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      active: counts.active || 0,
      waiting: counts.waiting || 0,
      jobsToday,
      avgProcessingTime: Math.round(avgProcessingTime * 100) / 100,
      diskUsage: {
        downloads: downloadsSize,
        output: outputSize,
        total: downloadsSize + outputSize,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// GET /jobs
// ---------------------------------------------------------------------------
router.get('/jobs', async (req, res, next) => {
  try {
    const status = req.query.status || 'all';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let jobs = [];

    if (status === 'completed') {
      jobs = await queue.getCompleted(start, end);
    } else if (status === 'failed') {
      jobs = await queue.getFailed(start, end);
    } else if (status === 'active') {
      jobs = await queue.getActive();
    } else if (status === 'waiting') {
      jobs = await queue.getWaiting(start, end);
    } else {
      // 'all' – fetch every type and merge
      const [completed, failed, active, waiting] = await Promise.all([
        queue.getCompleted(0, 200),
        queue.getFailed(0, 200),
        queue.getActive(),
        queue.getWaiting(0, 200),
      ]);
      jobs = [...completed, ...failed, ...active, ...waiting];
    }

    // Sort by timestamp descending (newest first)
    jobs.sort((a, b) => b.timestamp - a.timestamp);

    // For 'all', paginate the merged array after sorting
    if (status === 'all') {
      jobs = jobs.slice(start, start + limit);
    }

    // Map to response shape
    const mapped = await Promise.all(
      jobs.map(async (job) => ({
        id: job.id,
        videoTitle: job.data.title,
        status: job.data.stage || (await job.getState()),
        progress: job.progress,
        clipCount: job.data.clipCount,
        platform: job.data.platform,
        createdAt: new Date(job.timestamp).toISOString(),
        completedAt: job.data.completedAt || null,
        error: job.data.error || job.failedReason || null,
        duration: job.data.duration,
      }))
    );

    // Total count across all statuses
    const counts = await queue.getJobCounts();
    const total = Object.values(counts).reduce((sum, c) => sum + c, 0);

    res.json({ jobs: mapped, total, page, limit });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// POST /jobs/:id/retry
// ---------------------------------------------------------------------------
router.post('/jobs/:id/retry', async (req, res, next) => {
  try {
    const job = await queue.getJob(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const state = await job.getState();
    if (state !== 'failed') {
      return res.status(400).json({ error: `Job is not in failed state (current: ${state})` });
    }

    await job.retry();
    logger.info(`Admin retried job ${job.id}`);

    res.json({ message: 'Job queued for retry', jobId: job.id });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// DELETE /jobs/:id
// ---------------------------------------------------------------------------
router.delete('/jobs/:id', async (req, res, next) => {
  try {
    const job = await queue.getJob(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await job.remove();
    logger.info(`Admin removed job ${job.id}`);

    res.json({ message: 'Job removed', jobId: job.id });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// POST /cleanup
// ---------------------------------------------------------------------------
router.post('/cleanup', async (req, res, next) => {
  try {
    const downloadsRemoved = await sweepOldFiles(path.resolve(config.paths.downloads));
    const outputRemoved = await sweepOldFiles(path.resolve(config.paths.output));

    logger.info(`Admin cleanup: removed ${downloadsRemoved} downloads, ${outputRemoved} output entries`);

    res.json({
      removed: downloadsRemoved + outputRemoved,
      downloadsRemoved,
      outputRemoved,
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// GET /system
// ---------------------------------------------------------------------------
router.get('/system', async (req, res, next) => {
  try {
    // CPU
    const cpus = os.cpus();
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((s, t) => s + t, 0);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;

    // Memory
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    // Disk
    const downloadsDir = path.resolve(config.paths.downloads);
    const outputDir = path.resolve(config.paths.output);
    const downloadsSize = getDirSize(downloadsDir);
    const outputSize = getDirSize(outputDir);

    // Uptime
    const uptime = process.uptime();

    // Redis info
    let redisInfo = null;
    try {
      const Redis = require('ioredis');
      const tempRedis = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        lazyConnect: true,
      });
      await tempRedis.connect();
      const info = await tempRedis.info('memory');
      const match = info.match(/used_memory_human:(.+)/);
      redisInfo = match ? match[1].trim() : 'unknown';
      await tempRedis.disconnect();
    } catch (err) {
      redisInfo = `error: ${err.message}`;
    }

    // Dependencies
    const deps = {};

    // ffmpeg
    try {
      const { stdout } = await execAsync('ffmpeg -version');
      const firstLine = stdout.split('\n')[0];
      deps.ffmpeg = firstLine || 'installed';
    } catch {
      deps.ffmpeg = 'not found';
    }

    // yt-dlp
    try {
      const { stdout } = await execAsync('yt-dlp --version');
      deps.ytdlp = stdout.trim();
    } catch {
      deps.ytdlp = 'not found';
    }

    // aria2c
    try {
      const { stdout } = await execAsync('aria2c --version');
      const firstLine = stdout.split('\n')[0];
      deps.aria2c = firstLine || 'installed';
    } catch {
      deps.aria2c = 'not found';
    }

    // faster-whisper
    try {
      const { stdout } = await execAsync('python3 -c "import faster_whisper; print(faster_whisper.__version__)"');
      deps.fasterWhisper = stdout.trim();
    } catch {
      deps.fasterWhisper = 'not found';
    }

    // mediapipe
    try {
      const { stdout } = await execAsync('python3 -c "import mediapipe; print(mediapipe.__version__)"');
      deps.mediapipe = stdout.trim();
    } catch {
      deps.mediapipe = 'not found';
    }

    res.json({
      cpu: {
        cores: cpus.length,
        usage: Math.round(cpuUsage * 100) / 100,
      },
      memory: {
        total: totalMem,
        used: totalMem - freeMem,
        free: freeMem,
      },
      disk: {
        downloads: downloadsSize,
        output: outputSize,
        total: downloadsSize + outputSize,
      },
      uptime,
      redis: redisInfo,
      dependencies: deps,
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// GET /logs
// ---------------------------------------------------------------------------
router.get('/logs', async (req, res, next) => {
  try {
    const lineCount = parseInt(req.query.lines, 10) || 100;
    const logPath = path.join(config.paths.logs, 'combined.log');

    let content = '';
    try {
      content = fs.readFileSync(logPath, 'utf-8');
    } catch (err) {
      return res.json({ lines: [], total: 0 });
    }

    const allLines = content.split('\n').filter((l) => l.length > 0);
    const total = allLines.length;
    const lines = allLines.slice(-lineCount);

    res.json({ lines, total });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

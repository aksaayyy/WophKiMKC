const { Router } = require('express');
const { addJob, getJobStatus } = require('../workers/clip-worker');
const Downloader = require('../services/downloader');
const { validateUrl, validateOptions } = require('../utils/validators');
const logger = require('../utils/logger');
const config = require('../config');

const router = Router();
const downloader = new Downloader();

/**
 * POST /api/jobs - Create a new clip generation job
 */
router.post('/', async (req, res, next) => {
  try {
    const { url, clipCount, clipDuration, platform, useSmartDetection, detectionMode, enableSubtitles, subtitleStyle, enableFaceTracking } = req.body;

    // Validate URL
    const urlResult = validateUrl(url);
    if (!urlResult.valid) {
      return res.status(400).json({ error: urlResult.error });
    }

    // Validate options
    const optResult = validateOptions({ clipCount, clipDuration, platform, useSmartDetection, detectionMode, enableSubtitles, subtitleStyle, enableFaceTracking });
    if (!optResult.valid) {
      return res.status(400).json({ error: optResult.errors.join(', ') });
    }

    // Fetch video info
    const videoInfo = await downloader.getVideoInfo(url);

    // Validate clip count vs video duration
    const opts = optResult.options;
    if (videoInfo.duration < opts.clipDuration) {
      return res.status(400).json({
        error: `Video is only ${videoInfo.duration}s long, shorter than clip duration of ${opts.clipDuration}s`,
      });
    }

    const maxPossibleClips = Math.floor(videoInfo.duration / opts.clipDuration);
    if (opts.clipCount > maxPossibleClips) {
      opts.clipCount = maxPossibleClips;
    }

    // Create job
    const job = await addJob({
      url,
      videoId: videoInfo.id,
      title: videoInfo.title,
      duration: videoInfo.duration,
      thumbnail: videoInfo.thumbnail,
      clipCount: opts.clipCount,
      clipDuration: opts.clipDuration,
      platform: opts.platform,
      useSmartDetection: opts.useSmartDetection,
      detectionMode: opts.detectionMode,
      enableSubtitles: opts.enableSubtitles,
      subtitleStyle: opts.subtitleStyle,
      enableFaceTracking: opts.enableFaceTracking,
      stage: 'queued',
    });

    res.status(201).json({
      jobId: job.id,
      videoTitle: videoInfo.title,
      videoDuration: videoInfo.duration,
      thumbnail: videoInfo.thumbnail,
      clipCount: opts.clipCount,
      clipDuration: opts.clipDuration,
      platform: opts.platform,
      status: 'queued',
    });
  } catch (error) {
    logger.error(`Failed to create job: ${error.message}`);
    next(error);
  }
});

/**
 * GET /api/jobs/:id - Get job status
 */
router.get('/:id', async (req, res, next) => {
  try {
    const status = await getJobStatus(req.params.id);
    if (!status) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(status);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { addJob, getJobStatus } = require('../workers/clip-worker');
const Downloader = require('../services/downloader');
const { validateUrl, validateOptions } = require('../utils/validators');
const logger = require('../utils/logger');

const router = Router();
const downloader = new Downloader();

// In-memory store for batch metadata
const batches = new Map();

/**
 * POST /api/batch - Create a batch of clip generation jobs
 */
router.post('/', async (req, res, next) => {
  try {
    const { urls, ...optionFields } = req.body;

    // Validate urls array
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'urls must be a non-empty array' });
    }
    if (urls.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 URLs per batch' });
    }

    // Validate options once
    const optResult = validateOptions(optionFields);
    if (!optResult.valid) {
      return res.status(400).json({ error: optResult.errors.join(', ') });
    }
    const opts = optResult.options;

    const batchId = uuidv4();
    const jobs = [];
    const errors = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        // Validate URL
        const urlResult = validateUrl(url);
        if (!urlResult.valid) {
          errors.push({ index: i, url, error: urlResult.error });
          continue;
        }

        // Fetch video info
        const videoInfo = await downloader.getVideoInfo(url);

        // Validate clip count vs video duration
        let clipCount = opts.clipCount;
        if (videoInfo.duration < opts.clipDuration) {
          errors.push({
            index: i,
            url,
            error: `Video is only ${videoInfo.duration}s long, shorter than clip duration of ${opts.clipDuration}s`,
          });
          continue;
        }

        const maxPossibleClips = Math.floor(videoInfo.duration / opts.clipDuration);
        if (clipCount > maxPossibleClips) {
          clipCount = maxPossibleClips;
        }

        // Create job
        const job = await addJob({
          url,
          videoId: videoInfo.id,
          title: videoInfo.title,
          duration: videoInfo.duration,
          thumbnail: videoInfo.thumbnail,
          clipCount,
          clipDuration: opts.clipDuration,
          platform: opts.platform,
          useSmartDetection: opts.useSmartDetection,
          detectionMode: opts.detectionMode,
          enableSubtitles: opts.enableSubtitles,
          subtitleStyle: opts.subtitleStyle,
          enableFaceTracking: opts.enableFaceTracking,
          stage: 'queued',
        });

        jobs.push({
          jobId: job.id,
          videoTitle: videoInfo.title,
          videoDuration: videoInfo.duration,
          thumbnail: videoInfo.thumbnail,
        });
      } catch (err) {
        errors.push({ index: i, url, error: err.message });
      }
    }

    // Store batch metadata
    batches.set(batchId, {
      id: batchId,
      jobIds: jobs.map(j => j.jobId),
      createdAt: new Date().toISOString(),
      totalUrls: urls.length,
    });

    logger.info(`Batch ${batchId} created: ${jobs.length} jobs queued, ${errors.length} failed`);

    res.status(201).json({
      batchId,
      jobs,
      errors,
      totalQueued: jobs.length,
      totalFailed: errors.length,
    });
  } catch (error) {
    logger.error(`Failed to create batch: ${error.message}`);
    next(error);
  }
});

/**
 * GET /api/batch/:batchId - Get batch status
 */
router.get('/:batchId', async (req, res, next) => {
  try {
    const batch = batches.get(req.params.batchId);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Get status of all jobs
    const jobStatuses = [];
    let completed = 0;
    let failed = 0;
    let inProgress = 0;
    let totalProgress = 0;

    for (const jobId of batch.jobIds) {
      const status = await getJobStatus(jobId);
      if (status) {
        jobStatuses.push(status);
        totalProgress += status.progress || 0;

        if (status.status === 'completed' || status.status === 'ready') {
          completed++;
        } else if (status.status === 'failed') {
          failed++;
        } else {
          inProgress++;
        }
      }
    }

    const totalJobs = batch.jobIds.length;
    const overallProgress = totalJobs > 0 ? Math.round(totalProgress / totalJobs) : 0;

    res.json({
      batchId: batch.id,
      createdAt: batch.createdAt,
      totalJobs,
      completed,
      failed,
      inProgress,
      overallProgress,
      jobs: jobStatuses,
    });
  } catch (error) {
    logger.error(`Failed to get batch status: ${error.message}`);
    next(error);
  }
});

module.exports = router;

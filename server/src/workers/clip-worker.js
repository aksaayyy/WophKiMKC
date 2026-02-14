const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const fs = require('fs').promises;
const path = require('path');
const Downloader = require('../services/downloader');
const Clipper = require('../services/clipper');
const HookDetector = require('../services/hook-detector');
const Transcriber = require('../services/transcriber');
const FaceTracker = require('../services/face-tracker');
const YouTubeUploader = require('../services/uploader');
const { scheduleCleanup, deleteFile } = require('../utils/cleanup');
const logger = require('../utils/logger');
const config = require('../config');

const connection = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null,
});

const clipQueue = new Queue('clip-processing', { connection });

const downloader = new Downloader();
const clipper = new Clipper();
const hookDetector = new HookDetector();
const uploader = new YouTubeUploader();

const worker = new Worker('clip-processing', async (job) => {
  const {
    url, videoId, title, duration,
    clipCount, clipDuration, platform,
    useSmartDetection,
    detectionMode, enableSubtitles, subtitleStyle, enableFaceTracking,
  } = job.data;

  let videoPath = null;

  try {
    // Stage 1: DOWNLOADING (0-20%)
    await job.updateProgress(5);
    await job.updateData({ ...job.data, stage: 'downloading' });
    videoPath = await downloader.downloadVideo(url, job.id);
    await job.updateProgress(20);

    // Stage 2: ANALYZING (20-40%)
    // Determine detection mode (backwards-compatible with useSmartDetection)
    const mode = detectionMode || (useSmartDetection ? 'smart' : 'quick');
    let hookPoints;
    let transcriptData = null; // Cache for subtitle reuse

    switch (mode) {
      case 'smart': {
        // Transcribe first, then use transcript for smart detection
        await job.updateData({ ...job.data, stage: 'transcribing' });
        const transcriber = new Transcriber();
        try {
          transcriptData = await transcriber.transcribe(videoPath, { wordTimestamps: true });
        } catch (e) {
          logger.warn(`Transcription failed, falling back to quick mode: ${e.message}`);
        }
        await job.updateProgress(30);

        await job.updateData({ ...job.data, stage: 'analyzing' });
        if (transcriptData && transcriptData.segments) {
          // Use audio-based hook detection (smart uses loudness analysis)
          hookPoints = await hookDetector.findHookPoints(videoPath, clipDuration, clipCount, duration);
        } else {
          hookPoints = await hookDetector.findHookPoints(videoPath, clipDuration, clipCount, duration);
        }
        break;
      }
      case 'quick':
        await job.updateData({ ...job.data, stage: 'analyzing' });
        hookPoints = await hookDetector.findHookPoints(videoPath, clipDuration, clipCount, duration);
        break;
      default:
        await job.updateData({ ...job.data, stage: 'analyzing' });
        hookPoints = hookDetector.getEvenlySpacedClips(duration, clipDuration, clipCount);
    }
    await job.updateProgress(40);

    // Stage 3: FACE TRACKING (40-45%, if enabled)
    let cropFilter = null;
    if (enableFaceTracking) {
      await job.updateData({ ...job.data, stage: 'face_tracking' });
      const faceTracker = new FaceTracker();
      const crop = await faceTracker.detectAndComputeCrop(videoPath);
      if (crop) cropFilter = faceTracker.getCropFilter(crop);
      await job.updateProgress(45);
    }

    // Stage 4: SUBTITLING (45-50%, if enabled)
    let transcriptSegments = null;
    if (enableSubtitles) {
      await job.updateData({ ...job.data, stage: 'subtitling' });
      if (!transcriptData) {
        const transcriber = new Transcriber();
        transcriptData = await transcriber.transcribe(videoPath, { wordTimestamps: true });
      }
      transcriptSegments = transcriptData.segments;
      await job.updateProgress(50);
    }

    // Stage 5: CLIPPING (50-80%)
    await job.updateData({ ...job.data, stage: 'clipping' });
    const clips = await clipper.generateClips(videoPath, hookPoints, job.id, platform, {
      enableSubtitles,
      subtitleStyle: subtitleStyle || 'highlight',
      cropFilter,
      transcriptSegments,
    });

    // Update progress per clip
    for (let i = 0; i < clips.length; i++) {
      await job.updateProgress(50 + Math.floor((i + 1) / clips.length * 30));
    }

    // Stage 6: READY (80-100%)
    await job.updateData({
      ...job.data,
      stage: 'ready',
      clips: clips.map(c => ({
        filename: c.filename,
        downloadUrl: `/api/clips/${job.id}/${c.filename}`,
        startTime: c.startTime,
        duration: c.duration,
        hookScore: c.hookScore,
        uploadStatus: 'pending',
        youtubeUrl: null,
      })),
    });
    await job.updateProgress(80);

    // Stage 7: CLEANUP downloaded video (keep clips for download)
    await deleteFile(videoPath);
    videoPath = null;

    // Schedule cleanup of output directory after 1 hour
    const outputDir = path.join(config.paths.output, job.id);
    scheduleCleanup(outputDir);

    await job.updateProgress(100);
    await job.updateData({ ...job.data, stage: 'completed', completedAt: new Date().toISOString() });

    logger.info(`Job ${job.id} completed: ${clips.length} clips generated`);

    return {
      status: 'completed',
      videoTitle: title,
      videoId,
      clips: clips.map(c => ({
        filename: c.filename,
        downloadUrl: `/api/clips/${job.id}/${c.filename}`,
        startTime: c.startTime,
        duration: c.duration,
        hookScore: c.hookScore,
      })),
      completedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error(`Job ${job.id} failed: ${error.message}`);

    // Cleanup on error
    if (videoPath) await deleteFile(videoPath);

    await job.updateData({ ...job.data, stage: 'failed', error: error.message });
    throw error;
  }
}, {
  connection,
  concurrency: config.processing.workerConcurrency,
});

worker.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed`);
});

worker.on('failed', (job, error) => {
  logger.error(`Job ${job.id} failed: ${error.message}`);
});

/**
 * Add a job to the queue
 */
async function addJob(data) {
  const job = await clipQueue.add('process-video', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });
  logger.info(`Job ${job.id} added to queue`);
  return job;
}

/**
 * Get job status
 */
async function getJobStatus(jobId) {
  const job = await clipQueue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  const progress = job.progress;
  const data = job.data;
  const result = job.returnvalue;

  return {
    jobId: job.id,
    status: data.stage || state,
    progress: typeof progress === 'number' ? progress : 0,
    videoTitle: data.title,
    videoDuration: data.duration,
    videoId: data.videoId,
    clipCount: data.clipCount,
    platform: data.platform,
    clips: data.clips || [],
    error: data.error || null,
    createdAt: new Date(job.timestamp).toISOString(),
    completedAt: data.completedAt || null,
  };
}

/**
 * Trigger YouTube upload for a job's clips
 */
async function uploadJobClips(jobId) {
  const job = await clipQueue.getJob(jobId);
  if (!job) throw new Error('Job not found');

  if (!uploader.isConfigured()) {
    throw new Error('YouTube upload not configured. Set YOUTUBE_REFRESH_TOKENS in .env');
  }

  const clips = job.data.clips;
  if (!clips || clips.length === 0) {
    throw new Error('No clips available for upload');
  }

  await job.updateData({ ...job.data, stage: 'uploading' });

  const results = [];
  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    if (clip.uploadStatus === 'uploaded') continue;

    const clipPath = path.join(config.paths.output, jobId, clip.filename);
    const metadata = uploader.generateMetadata(job.data.title, i + 1, clips.length);

    try {
      const uploadResult = await uploader.uploadShort(clipPath, metadata);

      clips[i] = {
        ...clip,
        uploadStatus: 'uploaded',
        youtubeUrl: uploadResult.url,
      };

      results.push({ filename: clip.filename, url: uploadResult.url, accountId: uploadResult.accountId });

      logger.info(`Uploaded clip ${i + 1}/${clips.length}: ${uploadResult.url}`);

      // Delay between uploads
      if (i < clips.length - 1) {
        await new Promise(r => setTimeout(r, config.processing.uploadDelayMs));
      }
    } catch (err) {
      clips[i] = { ...clip, uploadStatus: 'failed' };
      logger.error(`Failed to upload clip ${i + 1}: ${err.message}`);
    }
  }

  await job.updateData({ ...job.data, clips, stage: 'completed' });
  return results;
}

module.exports = { addJob, getJobStatus, uploadJobClips, worker, queue: clipQueue, uploader };

const { Router } = require('express');
const { uploadJobClips, uploader } = require('../workers/clip-worker');
const logger = require('../utils/logger');

const router = Router();

/**
 * POST /api/upload/:jobId - Upload job's clips to YouTube
 */
router.post('/:jobId', async (req, res, next) => {
  try {
    if (!uploader.isConfigured()) {
      return res.status(400).json({ error: 'YouTube upload not configured. Set YOUTUBE_REFRESH_TOKENS in .env' });
    }

    const results = await uploadJobClips(req.params.jobId);
    res.json({ uploaded: results.length, results });
  } catch (error) {
    logger.error(`Upload failed: ${error.message}`);
    next(error);
  }
});

/**
 * GET /api/upload/accounts - Check upload configuration
 */
router.get('/accounts', (req, res) => {
  res.json({
    configured: uploader.isConfigured(),
    accountCount: uploader.getStats().length,
    accounts: uploader.getStats(),
  });
});

module.exports = router;

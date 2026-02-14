const { Router } = require('express');
const { uploader } = require('../workers/clip-worker');
const logger = require('../utils/logger');

const router = Router();

/**
 * GET /api/oauth/url - Get YouTube OAuth consent URL
 */
router.get('/url', (req, res) => {
  const url = uploader.getAuthUrl();
  res.json({ url });
});

/**
 * GET /api/oauth/callback - Exchange auth code for tokens
 */
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    const tokens = await uploader.getTokensFromCode(code);
    res.json({
      refreshToken: tokens.refresh_token,
      message: 'Add this refresh token to YOUTUBE_REFRESH_TOKENS in your .env file',
    });
  } catch (error) {
    logger.error(`OAuth callback failed: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

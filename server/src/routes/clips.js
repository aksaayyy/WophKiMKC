const { Router } = require('express');
const path = require('path');
const fs = require('fs');
const config = require('../config');

const router = Router();

/**
 * GET /api/clips/:jobId/:filename - Download a clip
 */
router.get('/:jobId/:filename', (req, res) => {
  const { jobId, filename } = req.params;

  // Sanitize filename to prevent path traversal
  const safeName = path.basename(filename);
  const filePath = path.join(config.paths.output, jobId, safeName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Clip not found' });
  }

  // Set CORS headers for mobile access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  
  // Set download headers
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Length', fs.statSync(filePath).size);
  
  // Stream the file
  const stream = fs.createReadStream(filePath);
  stream.on('error', (err) => {
    console.error('Stream error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream file' });
    }
  });
  stream.pipe(res);
});

module.exports = router;

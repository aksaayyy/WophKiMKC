/**
 * Extract video ID from various YouTube URL formats
 */
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
    /youtube\.com\/live\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Validate YouTube URL format
 */
function validateUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const videoId = extractVideoId(url.trim());
  if (!videoId) {
    return { valid: false, error: 'Invalid YouTube URL' };
  }

  return { valid: true, videoId };
}

/**
 * Validate processing options
 */
function validateOptions(options = {}) {
  const config = require('../config');
  const errors = [];

  const clipCount = options.clipCount ?? config.processing.defaultClipCount;
  if (clipCount < 1 || clipCount > config.processing.maxClipsPerJob) {
    errors.push(`clipCount must be between 1 and ${config.processing.maxClipsPerJob}`);
  }

  const clipDuration = options.clipDuration ?? config.processing.defaultClipDuration;
  if (clipDuration < config.processing.minClipDuration || clipDuration > config.processing.maxClipDuration) {
    errors.push(`clipDuration must be between ${config.processing.minClipDuration} and ${config.processing.maxClipDuration}`);
  }

  const validPlatforms = ['youtube', 'tiktok', 'instagram'];
  const platform = options.platform || 'youtube';
  if (!validPlatforms.includes(platform)) {
    errors.push(`platform must be one of: ${validPlatforms.join(', ')}`);
  }

  // Detection mode: 'smart', 'quick', or 'even'
  const validDetectionModes = ['smart', 'quick', 'even'];
  let detectionMode = options.detectionMode;
  if (!detectionMode) {
    // Backwards-compatible: derive from legacy useSmartDetection flag
    detectionMode = options.useSmartDetection !== false ? 'smart' : 'quick';
  }
  if (!validDetectionModes.includes(detectionMode)) {
    errors.push(`detectionMode must be one of: ${validDetectionModes.join(', ')}`);
  }

  // Subtitle options
  const enableSubtitles = !!options.enableSubtitles;
  const validSubtitleStyles = ['standard', 'highlight'];
  const subtitleStyle = options.subtitleStyle || 'highlight';
  if (!validSubtitleStyles.includes(subtitleStyle)) {
    errors.push(`subtitleStyle must be one of: ${validSubtitleStyles.join(', ')}`);
  }

  // Face tracking
  const enableFaceTracking = !!options.enableFaceTracking;

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    options: {
      clipCount,
      clipDuration,
      platform,
      useSmartDetection: detectionMode === 'smart',
      detectionMode,
      enableSubtitles,
      subtitleStyle,
      enableFaceTracking,
    },
  };
}

module.exports = { extractVideoId, validateUrl, validateOptions };

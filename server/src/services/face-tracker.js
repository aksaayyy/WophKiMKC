const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const logger = require('../utils/logger');
const config = require('../config');

const execAsync = promisify(exec);

class FaceTracker {
  /**
   * Run face detection on a video and compute a 9:16 crop region
   * centered on the dominant face.
   * @param {string} videoPath - path to the source video
   * @param {number} targetWidth - output width (default 1080)
   * @param {number} targetHeight - output height (default 1920)
   * @returns {Promise<{cropX: number, cropY: number, cropW: number, cropH: number}|null>}
   */
  async detectAndComputeCrop(videoPath, targetWidth = 1080, targetHeight = 1920) {
    const pythonPath = config.whisper.pythonPath || 'python3';
    const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'face_detect.py');

    const command = `${pythonPath} "${scriptPath}" "${videoPath}" --interval 1.0 --max-faces 4`;

    let stdout;
    try {
      const result = await execAsync(command, {
        maxBuffer: 50 * 1024 * 1024,
        timeout: 300000,
      });
      stdout = result.stdout;
    } catch (error) {
      logger.error(`Face detection failed: ${error.message}`);
      return null;
    }

    let data;
    try {
      data = JSON.parse(stdout);
    } catch (error) {
      logger.error(`Failed to parse face detection output: ${error.message}`);
      return null;
    }

    if (!data.detections || data.detections.length === 0) {
      logger.info('No face detections found');
      return null;
    }

    const videoWidth = data.width;
    const videoHeight = data.height;

    const dominant = this._findDominantFaceRegion(data.detections);
    if (!dominant) {
      logger.info('No dominant face region found');
      return null;
    }

    // Convert relative coordinates to absolute pixels
    const faceCenterX = (dominant.x + dominant.w / 2) * videoWidth;
    const faceCenterY = (dominant.y + dominant.h / 2) * videoHeight;

    // Compute crop dimensions maintaining 9:16 aspect ratio
    const targetAspect = targetWidth / targetHeight; // 9/16
    let cropW, cropH;

    // Try to fit the crop within video dimensions
    cropH = videoHeight;
    cropW = Math.round(cropH * targetAspect);

    if (cropW > videoWidth) {
      cropW = videoWidth;
      cropH = Math.round(cropW / targetAspect);
    }

    // Center crop on the dominant face X position
    let cropX = Math.round(faceCenterX - cropW / 2);

    // Slight upward bias for Y - place face in upper third
    let cropY = Math.round(faceCenterY - cropH * 0.35);

    // Clamp to video bounds
    cropX = Math.max(0, Math.min(cropX, videoWidth - cropW));
    cropY = Math.max(0, Math.min(cropY, videoHeight - cropH));

    logger.info(`Face tracking crop: x=${cropX}, y=${cropY}, w=${cropW}, h=${cropH} (video: ${videoWidth}x${videoHeight})`);

    return { cropX, cropY, cropW, cropH };
  }

  /**
   * Find the dominant face region by quantizing positions to a grid
   * and finding the most frequent cell.
   * @param {Array} detections - array of {time, faces} objects
   * @returns {{x: number, y: number, w: number, h: number}|null} - average relative position of dominant face
   */
  _findDominantFaceRegion(detections) {
    const gridSize = 10;
    const cellCounts = {};
    const cellPositions = {};

    for (const detection of detections) {
      if (!detection.faces || detection.faces.length === 0) continue;

      for (const face of detection.faces) {
        const centerX = face.x + face.w / 2;
        const centerY = face.y + face.h / 2;

        const cellX = Math.min(Math.floor(centerX * gridSize), gridSize - 1);
        const cellY = Math.min(Math.floor(centerY * gridSize), gridSize - 1);
        const cellKey = `${cellX},${cellY}`;

        if (!cellCounts[cellKey]) {
          cellCounts[cellKey] = 0;
          cellPositions[cellKey] = [];
        }

        cellCounts[cellKey]++;
        cellPositions[cellKey].push(face);
      }
    }

    // Find the cell with the most detections
    let maxCount = 0;
    let maxKey = null;
    for (const [key, count] of Object.entries(cellCounts)) {
      if (count > maxCount) {
        maxCount = count;
        maxKey = key;
      }
    }

    if (!maxKey) return null;

    // Average position of faces in the dominant cell
    const faces = cellPositions[maxKey];
    const avgX = faces.reduce((sum, f) => sum + f.x, 0) / faces.length;
    const avgY = faces.reduce((sum, f) => sum + f.y, 0) / faces.length;
    const avgW = faces.reduce((sum, f) => sum + f.w, 0) / faces.length;
    const avgH = faces.reduce((sum, f) => sum + f.h, 0) / faces.length;

    return { x: avgX, y: avgY, w: avgW, h: avgH };
  }

  /**
   * Generate an FFmpeg crop filter string from crop parameters.
   * @param {{cropX: number, cropY: number, cropW: number, cropH: number}} crop
   * @returns {string} FFmpeg crop filter
   */
  getCropFilter(crop) {
    return `crop=${crop.cropW}:${crop.cropH}:${crop.cropX}:${crop.cropY}`;
  }
}

module.exports = FaceTracker;

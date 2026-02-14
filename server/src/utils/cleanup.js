const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');
const config = require('../config');

const CLEANUP_DELAY_MS = 60 * 60 * 1000; // 1 hour
const SWEEP_INTERVAL_MS = parseInt(process.env.CLEANUP_INTERVAL_HOURS || '14') * 60 * 60 * 1000;
const MAX_FILE_AGE_MS = SWEEP_INTERVAL_MS;

/**
 * Schedule cleanup of a job's output directory
 */
function scheduleCleanup(outputDir, delayMs = CLEANUP_DELAY_MS) {
  setTimeout(async () => {
    try {
      await fs.rm(outputDir, { recursive: true, force: true });
      logger.info(`Cleaned up output directory: ${outputDir}`);
    } catch (err) {
      logger.warn(`Cleanup failed for ${outputDir}: ${err.message}`);
    }
  }, delayMs);
}

/**
 * Delete a single file safely
 */
async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    logger.debug(`Deleted file: ${filePath}`);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      logger.warn(`Failed to delete ${filePath}: ${err.message}`);
    }
  }
}

/**
 * Remove all files older than MAX_FILE_AGE_MS from a directory
 */
async function sweepOldFiles(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const now = Date.now();
    let removed = 0;

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      try {
        const stat = await fs.stat(fullPath);
        if (now - stat.mtimeMs > MAX_FILE_AGE_MS) {
          if (entry.isDirectory()) {
            await fs.rm(fullPath, { recursive: true, force: true });
          } else {
            await fs.unlink(fullPath);
          }
          removed++;
        }
      } catch (err) {
        logger.warn(`Sweep: failed to remove ${fullPath}: ${err.message}`);
      }
    }

    return removed;
  } catch (err) {
    if (err.code === 'ENOENT') return 0;
    logger.warn(`Sweep: failed to read ${dirPath}: ${err.message}`);
    return 0;
  }
}

/**
 * Run a full sweep of downloads + output directories
 */
async function runSweep() {
  const hours = (MAX_FILE_AGE_MS / 3600000).toFixed(0);
  logger.info(`Running file sweep (removing files older than ${hours}h)...`);

  const downloadsRemoved = await sweepOldFiles(path.resolve(config.paths.downloads));
  const outputRemoved = await sweepOldFiles(path.resolve(config.paths.output));

  const total = downloadsRemoved + outputRemoved;
  if (total > 0) {
    logger.info(`Sweep complete: removed ${downloadsRemoved} downloads, ${outputRemoved} output entries`);
  } else {
    logger.info('Sweep complete: nothing to clean up');
  }
}

let sweepTimer = null;

/**
 * Start the periodic cleanup sweep
 */
function startPeriodicSweep() {
  const hours = (SWEEP_INTERVAL_MS / 3600000).toFixed(0);
  logger.info(`File cleanup scheduled every ${hours} hours`);

  // Run once on startup to clean any leftovers
  runSweep();

  sweepTimer = setInterval(runSweep, SWEEP_INTERVAL_MS);
  sweepTimer.unref(); // Don't prevent process exit
}

function stopPeriodicSweep() {
  if (sweepTimer) {
    clearInterval(sweepTimer);
    sweepTimer = null;
  }
}

module.exports = { scheduleCleanup, deleteFile, sweepOldFiles, runSweep, startPeriodicSweep, stopPeriodicSweep };

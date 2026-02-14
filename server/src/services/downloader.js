const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const logger = require('../utils/logger');
const config = require('../config');

const execAsync = promisify(exec);
const MAX_BUFFER = 50 * 1024 * 1024; // 50MB for long video metadata

class Downloader {
  constructor() {
    this.downloadsDir = config.paths.downloads;
  }

  /**
   * Download video from YouTube
   */
  async downloadVideo(url, jobId) {
    const outputPath = path.join(this.downloadsDir, `${jobId}.mp4`);

    logger.info(`Downloading video: ${url}`);

    const args = [
      '-f', 'bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4]/best',
      '--merge-output-format', 'mp4',
    ];

    if (config.aria2c && config.aria2c.enabled) {
      const connections = config.aria2c.connections || 16;
      const splitSize = config.aria2c.splitSize || '1M';
      args.push(
        '--external-downloader', 'aria2c',
        '--external-downloader-args', `-x ${connections} -s ${connections} -k ${splitSize}`,
      );
      logger.info(`Using aria2c with ${connections} connections`);
    } else {
      args.push('-N', '8', '--concurrent-fragments', '8');
    }

    args.push('--no-playlist', '-o', outputPath, url);

    const command = `yt-dlp ${args.map(a => `"${a}"`).join(' ')}`;
    await execAsync(command, { maxBuffer: MAX_BUFFER, timeout: 600000 });

    // Verify file exists
    const fs = require('fs');
    if (!fs.existsSync(outputPath)) {
      throw new Error('Download failed: output file not found');
    }

    logger.info(`Video downloaded: ${outputPath}`);
    return outputPath;
  }

  /**
   * Get video metadata without downloading
   */
  async getVideoInfo(url) {
    logger.debug(`Fetching video info: ${url}`);

    const command = `yt-dlp -j --no-playlist "${url}"`;
    const { stdout } = await execAsync(command, { maxBuffer: MAX_BUFFER, timeout: 30000 });
    const info = JSON.parse(stdout);

    return {
      id: info.id,
      title: info.title,
      duration: info.duration,
      channel: info.uploader,
      thumbnail: info.thumbnail,
    };
  }
}

module.exports = Downloader;

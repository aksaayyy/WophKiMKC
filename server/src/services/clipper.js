const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');
const config = require('../config');
const SubtitleGenerator = require('./subtitle-generator');

const execAsync = promisify(exec);
const subtitleGenerator = new SubtitleGenerator();

class Clipper {
  /**
   * Generate clips from hook points
   * @param {string} inputPath - source video path
   * @param {Array} hookPoints - array of {startTime, endTime, score}
   * @param {string} jobId
   * @param {string} platform
   * @param {object} options - optional: { enableSubtitles, subtitleStyle, cropFilter, transcriptSegments }
   */
  async generateClips(inputPath, hookPoints, jobId, platform = 'youtube', options = {}) {
    const { enableSubtitles, subtitleStyle, cropFilter, transcriptSegments } = options;
    const outputDir = path.join(config.paths.output, jobId);
    await fs.mkdir(outputDir, { recursive: true });

    logger.info(`Generating ${hookPoints.length} clips for job ${jobId}`);

    const clips = [];
    for (let i = 0; i < hookPoints.length; i++) {
      const point = hookPoints[i];
      const duration = point.endTime - point.startTime;
      const filename = `clip_${i + 1}.mp4`;
      const outputPath = path.join(outputDir, filename);

      let subtitlePath = null;
      let hasSubtitles = false;

      // Generate subtitles if enabled and transcript segments are available
      if (enableSubtitles && transcriptSegments) {
        try {
          // Filter word-level timestamps that fall within this clip's time range
          const clipWords = transcriptSegments.filter(
            w => w.start >= point.startTime && w.end <= point.endTime
          );

          if (clipWords.length > 0) {
            // Normalize timestamps to be clip-relative (subtract clip startTime)
            const normalizedWords = clipWords.map(w => ({
              word: w.word,
              start: w.start - point.startTime,
              end: w.end - point.startTime,
              probability: w.probability || 1,
            }));

            subtitlePath = path.join(outputDir, `clip_${i + 1}.ass`);
            await subtitleGenerator.generateHighlightASS(normalizedWords, subtitlePath, subtitleStyle || {});
            hasSubtitles = true;
          } else {
            logger.info(`No transcript words found for clip ${i + 1} (${point.startTime}s - ${point.endTime}s), skipping subtitles`);
          }
        } catch (err) {
          logger.warn(`Failed to generate subtitles for clip ${i + 1}: ${err.message}`);
        }
      }

      await this.createClip(inputPath, point.startTime, duration, outputPath, platform, subtitlePath, cropFilter);

      clips.push({
        filename,
        path: outputPath,
        startTime: point.startTime,
        duration,
        hookScore: point.score,
        hasSubtitles,
      });

      logger.info(`Generated clip ${i + 1}/${hookPoints.length}: starts at ${point.startTime}s, score ${point.score.toFixed(2)}`);
    }

    return clips;
  }

  /**
   * Create a single clip using FFmpeg
   * @param {string} inputPath
   * @param {number} startTime
   * @param {number} duration
   * @param {string} outputPath
   * @param {string} platform
   * @param {string|null} subtitlePath - optional ASS subtitle file to burn in
   * @param {string|null} cropFilter - optional FFmpeg crop filter (e.g. "crop=W:H:X:Y")
   */
  async createClip(inputPath, startTime, duration, outputPath, platform, subtitlePath = null, cropFilter = null) {
    const settings = this.getPlatformSettings(platform);

    // Build video filter chain: [crop ->] scale -> pad -> setsar [-> ass]
    const vfParts = [];

    if (cropFilter) {
      vfParts.push(cropFilter);
    }

    vfParts.push(`scale=${settings.width}:${settings.height}:force_original_aspect_ratio=decrease`);
    vfParts.push(`pad=${settings.width}:${settings.height}:(ow-iw)/2:(oh-ih)/2`);
    vfParts.push('setsar=1');

    if (subtitlePath) {
      // Escape the subtitle path for FFmpeg filter: \ -> \\, : -> \:, ' -> '\''
      const escapedPath = subtitlePath
        .replace(/\\/g, '\\\\')
        .replace(/:/g, '\\:')
        .replace(/'/g, "'\\''");
      vfParts.push(`ass='${escapedPath}'`);
    }

    const vfChain = vfParts.join(',');

    const command = `ffmpeg -ss ${startTime} -i "${inputPath}" -t ${duration} \
      -vf "${vfChain}" \
      -c:v libx264 -preset ${settings.preset} -crf ${settings.crf} \
      -c:a aac -b:a 128k \
      -movflags +faststart \
      -y "${outputPath}" 2>&1`;

    await execAsync(command, { maxBuffer: 50 * 1024 * 1024 });
    return outputPath;
  }

  /**
   * Get platform-specific encoding settings
   */
  getPlatformSettings(platform) {
    const presets = {
      youtube: { width: 1080, height: 1920, preset: 'medium', crf: 20 },
      instagram: { width: 1080, height: 1920, preset: 'medium', crf: 20 },
      tiktok: { width: 1080, height: 1920, preset: 'medium', crf: 20 },
    };
    return presets[platform] || presets.youtube;
  }

  /**
   * Get video duration using ffprobe
   */
  async getVideoDuration(videoPath) {
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;
    const { stdout } = await execAsync(command);
    return Math.floor(parseFloat(stdout.trim()));
  }
}

module.exports = Clipper;

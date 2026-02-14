const { exec } = require('child_process');
const { promisify } = require('util');
const logger = require('../utils/logger');
const Transcriber = require('./transcriber');
const LLMScorer = require('./llm-scorer');

const execAsync = promisify(exec);
const MAX_BUFFER = 50 * 1024 * 1024;

class HookDetector {
  constructor() {
    this.transcriber = new Transcriber();
    this.llmScorer = new LLMScorer();
  }

  /**
   * Analyze per-second audio loudness using FFmpeg astats filter.
   * Returns array of { time, loudness } where loudness is 0-1 normalized.
   */
  async analyzeLoudness(videoPath) {
    logger.info('Analyzing audio loudness...');

    // FFmpeg astats outputs per-frame audio statistics
    // We use reset=1 to get per-second stats and pipe RMS_level to stdout
    const command = `ffmpeg -i "${videoPath}" -af "astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-" -f null - 2>/dev/null`;

    let stdout;
    try {
      const result = await execAsync(command, { maxBuffer: MAX_BUFFER });
      stdout = result.stdout;
    } catch (error) {
      // FFmpeg may exit with non-zero but still produce output
      if (error.stdout) {
        stdout = error.stdout;
      } else {
        logger.warn(`Audio analysis failed: ${error.message}`);
        return null;
      }
    }

    if (!stdout || !stdout.trim()) {
      logger.warn('No audio data from FFmpeg');
      return null;
    }

    const lines = stdout.split('\n');
    const loudnessData = [];
    let currentTime = 0;

    for (const line of lines) {
      const timeMatch = line.match(/pts_time:(\d+\.?\d*)/);
      if (timeMatch) {
        currentTime = parseFloat(timeMatch[1]);
      }

      const rmsMatch = line.match(/lavfi\.astats\.Overall\.RMS_level=(-?\d+\.?\d*|-inf)/);
      if (rmsMatch) {
        const rmsDbfs = rmsMatch[1] === '-inf' ? -100 : parseFloat(rmsMatch[1]);
        // Convert dBFS to linear (0-1 scale)
        const linear = rmsDbfs <= -100 ? 0 : Math.pow(10, rmsDbfs / 20);
        loudnessData.push({ time: Math.floor(currentTime), loudness: linear });
      }
    }

    if (loudnessData.length === 0) {
      logger.warn('No loudness data parsed');
      return null;
    }

    // Normalize to 0-1 range
    const maxLoudness = Math.max(...loudnessData.map(d => d.loudness));
    if (maxLoudness > 0) {
      for (const d of loudnessData) {
        d.loudness = d.loudness / maxLoudness;
      }
    }

    logger.info(`Analyzed ${loudnessData.length} seconds of audio`);
    return loudnessData;
  }

  /**
   * Backward-compatible wrapper that calls findHookPointsQuick().
   * This preserves the original API for callers that don't need smart detection.
   */
  async findHookPoints(videoPath, clipDuration, clipCount, videoDuration) {
    return this.findHookPointsQuick(videoPath, clipDuration, clipCount, videoDuration);
  }

  /**
   * Find the best hook points using audio energy analysis (quick method).
   * Uses a sliding window approach to find the most engaging segments.
   * This is the original findHookPoints() logic, renamed for clarity.
   */
  async findHookPointsQuick(videoPath, clipDuration, clipCount, videoDuration) {
    const loudness = await this.analyzeLoudness(videoPath);

    if (!loudness || loudness.length < clipDuration) {
      logger.info('Falling back to evenly-spaced clips');
      return this.getEvenlySpacedClips(videoDuration, clipDuration, clipCount);
    }

    const totalSeconds = loudness.length;
    const windows = [];

    for (let start = 0; start <= totalSeconds - clipDuration; start++) {
      const windowData = loudness
        .filter(d => d.time >= start && d.time < start + clipDuration)
        .map(d => d.loudness);

      if (windowData.length === 0) continue;

      // Average energy
      const avgEnergy = windowData.reduce((a, b) => a + b, 0) / windowData.length;

      // Energy variance (dynamic range - speech has variance, silence doesn't)
      const variance = windowData.reduce((sum, v) => sum + Math.pow(v - avgEnergy, 2), 0) / windowData.length;
      const normalizedVariance = Math.min(variance * 10, 1);

      // Opening bonus (first 10s of video usually has the hook)
      const openingBonus = start <= 10 ? 0.2 : 0;

      // Silence penalty
      const silentFrames = windowData.filter(v => v < 0.05).length;
      const silenceRatio = silentFrames / windowData.length;
      const silencePenalty = silenceRatio > 0.3 ? silenceRatio * 0.5 : 0;

      // Peak density bonus
      const peakThreshold = avgEnergy * 1.5;
      const peakCount = windowData.filter(v => v > peakThreshold).length;
      const peakDensity = Math.min(peakCount / clipDuration, 0.3);

      const score = (avgEnergy * 0.4) + (normalizedVariance * 0.25) + (peakDensity * 0.15) + openingBonus - silencePenalty;

      windows.push({ startTime: start, endTime: start + clipDuration, score });
    }

    // Sort by score descending
    windows.sort((a, b) => b.score - a.score);

    // Select top N non-overlapping
    const selected = [];
    for (const window of windows) {
      if (selected.length >= clipCount) break;

      const overlaps = selected.some(
        s => Math.abs(window.startTime - s.startTime) < clipDuration
      );

      if (!overlaps) {
        selected.push(window);
      }
    }

    // Sort chronologically
    selected.sort((a, b) => a.startTime - b.startTime);

    logger.info(`Found ${selected.length} hook points: ${selected.map(s => `${s.startTime}s (score: ${s.score.toFixed(2)})`).join(', ')}`);
    return selected;
  }

  /**
   * Smart hook detection using transcription + LLM scoring + audio analysis.
   * Falls back to findHookPointsQuick() on any error.
   * @param {string} videoPath - Path to the video file
   * @param {number} clipDuration - Target clip duration in seconds
   * @param {number} clipCount - Number of clips to select
   * @param {number} videoDuration - Total video duration in seconds
   * @param {string} videoTitle - Title of the video for LLM context
   * @returns {Promise<Array<{startTime: number, endTime: number, score: number}>>}
   */
  async findHookPointsSmart(videoPath, clipDuration, clipCount, videoDuration, videoTitle) {
    try {
      // Step 1: Transcribe video
      logger.info('Starting smart hook detection with transcription...');
      const transcript = await this.transcriber.transcribe(videoPath);

      // Step 2: Chunk transcript into clip-sized windows
      const chunks = this.transcriber.chunkTranscript(transcript.segments, clipDuration);

      if (!chunks || chunks.length === 0) {
        logger.info('No transcript chunks found, falling back to quick detection');
        return this.findHookPointsQuick(videoPath, clipDuration, clipCount, videoDuration);
      }

      // Step 3: Get audio loudness data
      const loudness = await this.analyzeLoudness(videoPath);

      // Step 4: LLM score chunks
      const llmScores = await this.llmScorer.scoreChunks(chunks, videoTitle);

      // Step 5: Combine scores: LLM (70%) + Audio (30%)
      const scoredChunks = chunks.map((chunk, i) => {
        const llmEntry = llmScores.find(s => s.chunkIndex === i);
        const llmScore = llmEntry ? llmEntry.score : 0.5;

        let audioScore = 0.5;
        if (loudness && loudness.length > 0) {
          audioScore = this._getAudioScoreForWindow(loudness, chunk.startTime, chunk.endTime);
        }

        const combinedScore = (llmScore * 0.7) + (audioScore * 0.3);

        return {
          startTime: Math.floor(chunk.startTime),
          endTime: Math.floor(chunk.startTime) + clipDuration,
          score: combinedScore,
          text: chunk.text,
        };
      });

      // Step 6: Sort by score descending
      scoredChunks.sort((a, b) => b.score - a.score);

      // Step 7: Select top N non-overlapping
      const selected = [];
      for (const chunk of scoredChunks) {
        if (selected.length >= clipCount) break;

        // Ensure clip doesn't exceed video duration
        if (chunk.startTime + clipDuration > videoDuration) continue;

        const overlaps = selected.some(
          s => Math.abs(chunk.startTime - s.startTime) < clipDuration
        );

        if (!overlaps) {
          selected.push({
            startTime: chunk.startTime,
            endTime: chunk.startTime + clipDuration,
            score: chunk.score,
          });
        }
      }

      // Step 8: Sort chronologically
      selected.sort((a, b) => a.startTime - b.startTime);

      logger.info(`Smart detection found ${selected.length} hook points: ${selected.map(s => `${s.startTime}s (score: ${s.score.toFixed(2)})`).join(', ')}`);
      return selected;

    } catch (error) {
      logger.error(`Smart hook detection failed: ${error.message}`);
      logger.info('Falling back to quick hook detection');
      return this.findHookPointsQuick(videoPath, clipDuration, clipCount, videoDuration);
    }
  }

  /**
   * Get average audio loudness score for a time window.
   * @param {Array<{time: number, loudness: number}>} loudness - Loudness data
   * @param {number} startTime - Window start time in seconds
   * @param {number} endTime - Window end time in seconds
   * @returns {number} Average loudness score 0-1
   */
  _getAudioScoreForWindow(loudness, startTime, endTime) {
    const windowData = loudness.filter(
      d => d.time >= startTime && d.time < endTime
    );

    if (windowData.length === 0) return 0.5;

    const avg = windowData.reduce((sum, d) => sum + d.loudness, 0) / windowData.length;
    return Math.max(0, Math.min(1, avg));
  }

  /**
   * Fallback: evenly-spaced clips with first clip at 0s.
   */
  getEvenlySpacedClips(videoDuration, clipDuration, clipCount) {
    const clips = [];
    for (let i = 0; i < clipCount; i++) {
      let startTime;
      if (i === 0) {
        startTime = 0;
      } else {
        const segment = (videoDuration - clipDuration) / clipCount;
        startTime = Math.floor(segment * i);
        const randomOffset = Math.floor(Math.random() * 20) - 10;
        startTime = Math.max(0, Math.min(videoDuration - clipDuration, startTime + randomOffset));
      }
      clips.push({ startTime, endTime: startTime + clipDuration, score: 0 });
    }
    return clips;
  }
}

module.exports = HookDetector;

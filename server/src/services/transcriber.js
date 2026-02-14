const { spawn } = require('child_process');
const path = require('path');
const logger = require('../utils/logger');
const config = require('../config');

class Transcriber {
  constructor() {
    this.scriptPath = path.resolve(__dirname, '../../scripts/transcribe.py');
    this.pythonPath = config.whisper.pythonPath || 'python3';
  }

  /**
   * Transcribe an audio/video file using faster-whisper via Python script.
   * @param {string} filePath - Path to the audio/video file
   * @param {object} options - Transcription options
   * @param {string} options.model - Whisper model size (default from config)
   * @param {string} options.language - Language code (auto-detect if not set)
   * @param {boolean} options.wordTimestamps - Enable word-level timestamps
   * @param {string} options.device - cpu or cuda (default from config)
   * @returns {Promise<object>} Transcription result with segments
   */
  async transcribe(filePath, options = {}) {
    const model = options.model || config.whisper.model || 'small';
    const device = options.device || config.whisper.device || 'cpu';
    const language = options.language || null;
    const wordTimestamps = options.wordTimestamps || false;

    const args = [this.scriptPath, filePath, '--model', model, '--device', device];

    if (language) {
      args.push('--language', language);
    }
    if (wordTimestamps) {
      args.push('--word-timestamps');
    }

    logger.info(`Transcribing: ${filePath} (model=${model}, device=${device})`);

    return new Promise((resolve, reject) => {
      const process = spawn(this.pythonPath, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      const timeout = setTimeout(() => {
        process.kill('SIGTERM');
        reject(new Error('Transcription timed out after 600 seconds'));
      }, 600000);

      process.on('close', (code) => {
        clearTimeout(timeout);

        if (code !== 0) {
          logger.error(`Transcription failed (exit code ${code}): ${stderr}`);
          reject(new Error(`Transcription failed: ${stderr || 'Unknown error'}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          if (result.error) {
            reject(new Error(result.error));
            return;
          }
          logger.info(`Transcription complete: ${result.segments?.length || 0} segments, duration=${result.duration}s`);
          resolve(result);
        } catch (parseError) {
          logger.error(`Failed to parse transcription output: ${parseError.message}`);
          reject(new Error(`Failed to parse transcription output: ${parseError.message}`));
        }
      });

      process.on('error', (err) => {
        clearTimeout(timeout);
        logger.error(`Failed to spawn transcription process: ${err.message}`);
        reject(new Error(`Failed to spawn transcription process: ${err.message}`));
      });
    });
  }

  /**
   * Group transcript segments into clip-sized windows.
   * Starts a new chunk when adding the next segment would exceed clipDuration * 1.2.
   * @param {Array} segments - Transcript segments from transcribe()
   * @param {number} clipDuration - Target clip duration in seconds
   * @returns {Array<{startTime: number, endTime: number, text: string, segmentIds: number[]}>}
   */
  chunkTranscript(segments, clipDuration) {
    if (!segments || segments.length === 0) {
      return [];
    }

    const maxDuration = clipDuration * 1.2;
    const chunks = [];
    let currentChunk = null;

    for (const segment of segments) {
      if (!currentChunk) {
        currentChunk = {
          startTime: segment.start,
          endTime: segment.end,
          text: segment.text,
          segmentIds: [segment.id],
        };
        continue;
      }

      const wouldEndAt = segment.end;
      const chunkDuration = wouldEndAt - currentChunk.startTime;

      if (chunkDuration > maxDuration) {
        // Finalize current chunk and start a new one
        chunks.push(currentChunk);
        currentChunk = {
          startTime: segment.start,
          endTime: segment.end,
          text: segment.text,
          segmentIds: [segment.id],
        };
      } else {
        // Add to current chunk
        currentChunk.endTime = segment.end;
        currentChunk.text += ' ' + segment.text;
        currentChunk.segmentIds.push(segment.id);
      }
    }

    // Don't forget the last chunk
    if (currentChunk) {
      chunks.push(currentChunk);
    }

    logger.info(`Chunked ${segments.length} segments into ${chunks.length} windows (clipDuration=${clipDuration}s)`);
    return chunks;
  }
}

module.exports = Transcriber;

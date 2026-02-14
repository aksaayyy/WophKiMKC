const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class SubtitleGenerator {
  /**
   * Generate an ASS subtitle file from word-level timestamps.
   * @param {Array<{word: string, start: number, end: number, probability: number}>} words - clip-relative timestamps
   * @param {string} outputPath - path to write the ASS file
   * @param {object} style - optional style overrides
   * @returns {string} outputPath
   */
  async generateASS(words, outputPath, style = {}) {
    const fontSize = style.fontSize || 18;
    const fontName = style.fontName || 'Arial';
    const primaryColor = style.primaryColor || '&H00FFFFFF';
    const outlineColor = style.outlineColor || '&H00000000';
    const outlineWidth = style.outlineWidth || 3;
    const marginV = style.marginV || 60;

    const lines = this._groupWordsIntoLines(words, 6);

    let ass = '';
    ass += '[Script Info]\n';
    ass += 'ScriptType: v4.00+\n';
    ass += 'PlayResX: 1080\n';
    ass += 'PlayResY: 1920\n';
    ass += 'WrapStyle: 0\n';
    ass += '\n';
    ass += '[V4+ Styles]\n';
    ass += 'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n';
    ass += `Style: Default,${fontName},${fontSize},${primaryColor},&H000000FF,${outlineColor},&H00000000,-1,0,0,0,100,100,0,0,1,${outlineWidth},0,2,10,10,${marginV},1\n`;
    ass += '\n';
    ass += '[Events]\n';
    ass += 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n';

    for (const line of lines) {
      const startTime = this._formatASSTime(line.start);
      const endTime = this._formatASSTime(line.end);
      const text = line.words.map(w => w.word).join(' ');
      ass += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${text}\n`;
    }

    await fs.writeFile(outputPath, ass, 'utf8');
    logger.info(`Generated ASS subtitle: ${outputPath}`);
    return outputPath;
  }

  /**
   * Generate an ASS subtitle file with karaoke-style word-by-word highlighting.
   * Uses \kf tags for smooth fill highlighting.
   * @param {Array<{word: string, start: number, end: number, probability: number}>} words
   * @param {string} outputPath
   * @param {object} style
   * @returns {string} outputPath
   */
  async generateHighlightASS(words, outputPath, style = {}) {
    const fontSize = style.fontSize || 18;
    const fontName = style.fontName || 'Arial';
    const primaryColor = style.primaryColor || '&H00FFFFFF';
    const secondaryColor = style.secondaryColor || '&H0000FFFF';
    const outlineColor = style.outlineColor || '&H00000000';
    const outlineWidth = style.outlineWidth || 3;
    const marginV = style.marginV || 60;

    const lines = this._groupWordsIntoLines(words, 5);

    let ass = '';
    ass += '[Script Info]\n';
    ass += 'ScriptType: v4.00+\n';
    ass += 'PlayResX: 1080\n';
    ass += 'PlayResY: 1920\n';
    ass += 'WrapStyle: 0\n';
    ass += '\n';
    ass += '[V4+ Styles]\n';
    ass += 'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n';
    ass += `Style: Default,${fontName},${fontSize},${primaryColor},${secondaryColor},${outlineColor},&H00000000,-1,0,0,0,100,100,0,0,1,${outlineWidth},0,2,10,10,${marginV},1\n`;
    ass += '\n';
    ass += '[Events]\n';
    ass += 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n';

    for (const line of lines) {
      const startTime = this._formatASSTime(line.start);
      const endTime = this._formatASSTime(line.end);

      let text = '';
      for (let i = 0; i < line.words.length; i++) {
        const w = line.words[i];
        const durationCs = Math.round((w.end - w.start) * 100);
        const prefix = i > 0 ? ' ' : '';
        text += `${prefix}{\\kf${durationCs}}${w.word}`;
      }

      ass += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${text}\n`;
    }

    await fs.writeFile(outputPath, ass, 'utf8');
    logger.info(`Generated highlight ASS subtitle: ${outputPath}`);
    return outputPath;
  }

  /**
   * Generate an SRT subtitle file from word-level timestamps.
   * @param {Array<{word: string, start: number, end: number, probability: number}>} words
   * @param {string} outputPath
   * @returns {string} outputPath
   */
  async generateSRT(words, outputPath) {
    const lines = this._groupWordsIntoLines(words, 8);

    let srt = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const startTime = this._formatSRTTime(line.start);
      const endTime = this._formatSRTTime(line.end);
      const text = line.words.map(w => w.word).join(' ');

      srt += `${i + 1}\n`;
      srt += `${startTime} --> ${endTime}\n`;
      srt += `${text}\n`;
      srt += '\n';
    }

    await fs.writeFile(outputPath, srt, 'utf8');
    logger.info(`Generated SRT subtitle: ${outputPath}`);
    return outputPath;
  }

  /**
   * Group words into lines of at most maxPerLine words.
   * Each line tracks the start time of its first word and end time of its last word.
   * @param {Array<{word: string, start: number, end: number}>} words
   * @param {number} maxPerLine
   * @returns {Array<{words: Array, start: number, end: number}>}
   */
  _groupWordsIntoLines(words, maxPerLine) {
    const lines = [];
    for (let i = 0; i < words.length; i += maxPerLine) {
      const chunk = words.slice(i, i + maxPerLine);
      lines.push({
        words: chunk,
        start: chunk[0].start,
        end: chunk[chunk.length - 1].end,
      });
    }
    return lines;
  }

  /**
   * Format seconds to ASS timestamp: H:MM:SS.CC
   * @param {number} seconds
   * @returns {string}
   */
  _formatASSTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const cs = Math.round((seconds % 1) * 100);
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }

  /**
   * Format seconds to SRT timestamp: HH:MM:SS,mmm
   * @param {number} seconds
   * @returns {string}
   */
  _formatSRTTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  }
}

module.exports = SubtitleGenerator;

const logger = require('../utils/logger');
const config = require('../config');

class LLMScorer {
  constructor() {
    this.provider = config.llm.provider || 'openai';
    this.apiKey = config.llm.apiKey || '';
    this.model = config.llm.model || '';
  }

  /**
   * Score transcript chunks for hook potential using an LLM.
   * Processes chunks in batches of 10.
   * If no API key is configured, returns uniform 0.5 scores.
   * @param {Array} chunks - Array of {startTime, endTime, text, segmentIds}
   * @param {string} videoTitle - Title of the video for context
   * @returns {Promise<Array<{chunkIndex: number, score: number}>>}
   */
  async scoreChunks(chunks, videoTitle) {
    if (!this.apiKey) {
      logger.info('No LLM API key configured, returning uniform scores');
      return chunks.map((_, i) => ({ chunkIndex: i, score: 0.5 }));
    }

    const batchSize = 10;
    const allScores = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      try {
        const batchScores = await this._scoreBatch(batch, videoTitle, i);
        allScores.push(...batchScores);
      } catch (error) {
        logger.error(`LLM scoring failed for batch starting at ${i}: ${error.message}`);
        // Fill failed batch with 0.5 scores
        for (let j = 0; j < batch.length; j++) {
          allScores.push({ chunkIndex: i + j, score: 0.5 });
        }
      }
    }

    return allScores;
  }

  /**
   * Score a single batch of chunks.
   * @param {Array} chunks - Batch of chunks to score
   * @param {string} videoTitle - Video title for context
   * @param {number} startIndex - Starting index of this batch in the full array
   * @returns {Promise<Array<{chunkIndex: number, score: number}>>}
   */
  async _scoreBatch(chunks, videoTitle, startIndex) {
    const prompt = this._buildPrompt(chunks, videoTitle, startIndex);

    let responseText;
    if (this.provider === 'anthropic') {
      responseText = await this._callAnthropic(prompt, chunks, startIndex);
    } else {
      responseText = await this._callOpenAI(prompt, chunks, startIndex);
    }

    return this._parseScores(responseText, chunks, startIndex);
  }

  /**
   * Build the scoring prompt for the LLM.
   * @param {Array} chunks - Chunks to score
   * @param {string} videoTitle - Video title
   * @param {number} startIndex - Starting index
   * @returns {string} The prompt text
   */
  _buildPrompt(chunks, videoTitle, startIndex) {
    let segmentList = '';
    chunks.forEach((chunk, i) => {
      const idx = startIndex + i;
      segmentList += `\nSegment ${idx} [${chunk.startTime.toFixed(1)}s - ${chunk.endTime.toFixed(1)}s]:\n"${chunk.text}"\n`;
    });

    return `You are an expert social media content strategist. Analyze these transcript segments from the video "${videoTitle}" and score each one on its potential as a short-form video hook/clip.

Score each segment from 0.0 to 1.0 based on:
1. Hook potential - Does it grab attention immediately?
2. Emotional engagement - Does it evoke curiosity, surprise, humor, or strong emotion?
3. Standalone clarity - Can it be understood without additional context?
4. Virality - Would someone share or engage with this clip?

${segmentList}

Respond with a JSON array of objects. Each object must have "index" (the segment number) and "score" (0.0 to 1.0).

Example response format:
[{"index": 0, "score": 0.85}, {"index": 1, "score": 0.42}]

Return ONLY the JSON array, no other text.`;
  }

  /**
   * Call OpenAI API.
   * @param {string} prompt - The prompt to send
   * @param {Array} chunks - Chunks being scored
   * @param {number} startIndex - Starting index
   * @returns {Promise<string>} Response text
   */
  async _callOpenAI(prompt, chunks, startIndex) {
    const model = this.model || 'gpt-4o-mini';
    logger.info(`Calling OpenAI (${model}) for chunks ${startIndex}-${startIndex + chunks.length - 1}`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a social media content scoring assistant. Always respond with valid JSON.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Call Anthropic API.
   * @param {string} prompt - The prompt to send
   * @param {Array} chunks - Chunks being scored
   * @param {number} startIndex - Starting index
   * @returns {Promise<string>} Response text
   */
  async _callAnthropic(prompt, chunks, startIndex) {
    const model = this.model || 'claude-sonnet-4-20250514';
    logger.info(`Calling Anthropic (${model}) for chunks ${startIndex}-${startIndex + chunks.length - 1}`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  /**
   * Parse scores from LLM response text.
   * Handles raw JSON arrays, JSON wrapped in code blocks, and JSON objects with a scores key.
   * @param {string} responseText - Raw LLM response
   * @param {Array} chunks - Original chunks
   * @param {number} startIndex - Starting index
   * @returns {Array<{chunkIndex: number, score: number}>}
   */
  _parseScores(responseText, chunks, startIndex) {
    let text = responseText.trim();

    // Remove markdown code blocks if present
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      text = codeBlockMatch[1].trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      logger.error(`Failed to parse LLM response as JSON: ${text.substring(0, 200)}`);
      // Return default scores
      return chunks.map((_, i) => ({ chunkIndex: startIndex + i, score: 0.5 }));
    }

    // Handle both array and object-with-array formats
    let scoresArray;
    if (Array.isArray(parsed)) {
      scoresArray = parsed;
    } else if (parsed && typeof parsed === 'object') {
      // Look for an array in the object values (e.g., { scores: [...] })
      const arrayValue = Object.values(parsed).find(v => Array.isArray(v));
      if (arrayValue) {
        scoresArray = arrayValue;
      } else {
        logger.error('LLM response does not contain a scores array');
        return chunks.map((_, i) => ({ chunkIndex: startIndex + i, score: 0.5 }));
      }
    } else {
      return chunks.map((_, i) => ({ chunkIndex: startIndex + i, score: 0.5 }));
    }

    // Map scores to chunks
    const result = chunks.map((_, i) => {
      const globalIndex = startIndex + i;
      const scoreEntry = scoresArray.find(s => s.index === globalIndex);
      const score = scoreEntry ? Math.max(0, Math.min(1, parseFloat(scoreEntry.score) || 0.5)) : 0.5;
      return { chunkIndex: globalIndex, score };
    });

    return result;
  }
}

module.exports = LLMScorer;

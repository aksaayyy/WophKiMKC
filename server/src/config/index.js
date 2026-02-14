require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT) || 3001,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  youtube: {
    clientId: process.env.YOUTUBE_CLIENT_ID,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
    redirectUri: process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3001/api/oauth/callback',
    refreshTokens: process.env.YOUTUBE_REFRESH_TOKENS || '',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  },
  paths: {
    downloads: process.env.DOWNLOAD_DIR || './downloads',
    output: process.env.OUTPUT_DIR || './output',
    logs: process.env.LOG_DIR || './logs',
  },
  processing: {
    defaultClipCount: parseInt(process.env.DEFAULT_CLIP_COUNT) || 3,
    defaultClipDuration: parseInt(process.env.DEFAULT_CLIP_DURATION) || 40,
    minClipDuration: 15,
    maxClipDuration: 90,
    maxClipsPerJob: 10,
    uploadDelayMs: parseInt(process.env.UPLOAD_DELAY_MS) || 5000,
    workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY) || 2,
  },
  aria2c: {
    enabled: process.env.ARIA2C_ENABLED !== 'false',
    connections: parseInt(process.env.ARIA2C_CONNECTIONS) || 16,
    splitSize: process.env.ARIA2C_SPLIT_SIZE || '1M',
  },
  whisper: {
    model: process.env.WHISPER_MODEL || 'small',
    device: process.env.WHISPER_DEVICE || 'cpu',
    pythonPath: process.env.PYTHON_PATH || 'python3',
  },
  llm: {
    provider: process.env.LLM_PROVIDER || 'openai',
    apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || '',
    model: process.env.LLM_MODEL || '',
  },
  debug: process.env.DEBUG === 'true',
};

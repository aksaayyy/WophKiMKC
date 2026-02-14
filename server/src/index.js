require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const config = require('./config');
const routes = require('./routes');
const errorHandler = require('./middleware/error-handler');
const logger = require('./utils/logger');

// Import worker to start it
require('./workers/clip-worker');

// Start periodic file cleanup
const { startPeriodicSweep } = require('./utils/cleanup');
startPeriodicSweep();

const app = express();

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: true }));
app.use(morgan('short'));
app.use(express.json());

// API routes
app.use('/api', routes);

// Error handler
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  logger.info(`HookClip server running on port ${config.port}`);
  logger.info(`Frontend URL: ${config.frontendUrl}`);
});

module.exports = app;

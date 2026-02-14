const { Router } = require('express');
const jobsRouter = require('./jobs');
const clipsRouter = require('./clips');
const uploadRouter = require('./upload');
const oauthRouter = require('./oauth');
const healthRouter = require('./health');
const batchRouter = require('./batch');
const adminRouter = require('./admin');

const router = Router();

router.use('/jobs', jobsRouter);
router.use('/clips', clipsRouter);
router.use('/upload', uploadRouter);
router.use('/oauth', oauthRouter);
router.use('/health', healthRouter);
router.use('/batch', batchRouter);
router.use('/admin', adminRouter);

module.exports = router;

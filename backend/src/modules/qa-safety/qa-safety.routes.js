const express = require('express');
const router = express.Router();
const qaController = require('./qa-safety.controller');
const { requireAuth } = require('../../middleware/authMiddleware');
const { requireWorkspace } = require('../../middleware/rbacGuard');

router.get('/cubes', qaController.getCubeTests);
router.post('/cubes', requireAuth, requireWorkspace('safety_qa'), qaController.recordCubeTest);

router.get('/snags', qaController.getSnags);
router.post('/snags', requireAuth, requireWorkspace('safety_qa'), qaController.recordSnag);
router.patch('/snags/:id/resolve', requireAuth, requireWorkspace('safety_qa'), qaController.resolveSnag);

router.post('/safety-briefing', requireAuth, requireWorkspace('safety_qa'), qaController.recordSafetyBriefing);

router.get('/visitors', qaController.getVisitors);
router.post('/visitors', requireAuth, requireWorkspace('safety_qa'), qaController.recordVisitor);

module.exports = router;

const express = require('express');
const router = express.Router();
const auditController = require('./audit.controller');
const { requireAuth } = require('../../middleware/authMiddleware');

router.get('/logs', requireAuth, auditController.getLogs);
router.get('/timeline/:entityType/:entityId', requireAuth, auditController.getTimeline);

module.exports = router;

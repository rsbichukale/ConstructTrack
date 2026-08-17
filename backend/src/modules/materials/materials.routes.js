const express = require('express');
const router = express.Router();
const materialsController = require('./materials.controller');
const { requireAuth } = require('../../middleware/authMiddleware');
const { requireWorkspace } = require('../../middleware/rbacGuard');

router.get('/inventory', materialsController.getInventory);
router.post('/inward', requireAuth, requireWorkspace('materials'), materialsController.recordInward);
router.post('/outward', requireAuth, requireWorkspace('materials'), materialsController.recordOutward);

module.exports = router;

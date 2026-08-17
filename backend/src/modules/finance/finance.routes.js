const express = require('express');
const router = express.Router();
const financeController = require('./finance.controller');
const { requireAuth } = require('../../middleware/authMiddleware');
const { requireWorkspace } = require('../../middleware/rbacGuard');

router.get('/', financeController.getClientChanges);
router.post('/', financeController.createClientChange);
router.patch('/:id', financeController.updateClientChangeStatus);
router.patch('/:id/status', financeController.updateClientChangeStatus);

router.get('/petty-cash', financeController.getPettyCashEntries);
router.post('/petty-cash', requireAuth, requireWorkspace('finance'), financeController.createPettyCashEntry);

router.get('/client-changes', financeController.getClientChanges);
router.post('/client-changes', financeController.createClientChange);
router.patch('/client-changes/:id', financeController.updateClientChangeStatus);
router.patch('/client-changes/:id/status', financeController.updateClientChangeStatus);
router.patch('/client-changes/:id/approve', requireAuth, requireWorkspace('finance'), financeController.approveClientChange);

module.exports = router;

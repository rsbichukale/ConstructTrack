const express = require('express');
const router = express.Router();
const billingController = require('./billing.controller');
const { requireAuth } = require('../../middleware/authMiddleware');
const { requireWorkspace } = require('../../middleware/rbacGuard');

router.get('/bills', billingController.getAllBills);
router.get('/bills/:id', billingController.getBillDetails);
router.get('/preview/:contractorId', billingController.previewRABill);
router.post('/generate', requireAuth, requireWorkspace('finance'), billingController.generateRABill);
router.patch('/bills/:id/certify', requireAuth, requireWorkspace('finance'), billingController.certifyBill);
router.patch('/bills/:id/pay', requireAuth, requireWorkspace('finance'), billingController.recordPayment);
router.post('/debit-notes', requireAuth, requireWorkspace('finance'), billingController.createDebitNote);

module.exports = router;

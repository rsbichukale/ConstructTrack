const express = require('express');
const router = express.Router();
const machineryController = require('./machinery.controller');

router.get('/assets', machineryController.getAllAssets);
router.post('/assets', machineryController.registerAsset);
router.patch('/assets/:id/status', machineryController.updateAssetStatus);
router.get('/logs', machineryController.getAllLogs);
router.post('/logs', machineryController.recordRunAndFuelLog);

module.exports = router;

const express = require('express');
const router = express.Router();
const SetupController = require('./setup.controller');

router.get('/presets', SetupController.getPresets);
router.post('/initialize', SetupController.initializeProject);

module.exports = router;

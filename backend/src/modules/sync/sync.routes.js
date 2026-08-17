const express = require('express');
const router = express.Router();
const syncController = require('./sync.controller');

router.get('/state', syncController.getFullState);
router.get('/status', syncController.getSyncStatus);
router.post('/drain', syncController.drainOutbox);
router.get('/events', syncController.liveEventsStream);

module.exports = router;

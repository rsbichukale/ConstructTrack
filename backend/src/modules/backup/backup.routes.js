const express = require('express');
const router = express.Router();
const BackupController = require('./backup.controller');

router.get('/list', BackupController.listBackups);
router.post('/create', BackupController.createBackup);
router.get('/download/:fileName', BackupController.downloadBackup);
router.post('/restore', BackupController.restoreBackup);

module.exports = router;

const express = require('express');
const router = express.Router();
const StorageController = require('./storage.controller');

router.get('/categories', StorageController.getCategories);
router.get('/files/:category', StorageController.listFiles);
router.post('/upload', StorageController.uploadFile);

module.exports = router;

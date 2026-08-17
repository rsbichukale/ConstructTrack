const express = require('express');
const router = express.Router();
const executionController = require('./execution.controller');
const { requireAuth } = require('../../middleware/authMiddleware');
const { requireWorkspace } = require('../../middleware/rbacGuard');

router.get('/flats', executionController.getTowerElevation);
router.get('/flats/:id', executionController.getFlatDetails);
router.get('/flats/:id/dimensions', executionController.getFlatRoomDimensions);
router.post('/flats/:id/dimensions/:zoneId', requireAuth, requireWorkspace('execution'), executionController.saveRoomDimensions);

router.post('/tasks/:taskId/assign', requireAuth, requireWorkspace('execution'), executionController.assignContractor);
router.post('/tasks/:taskId/start-today', requireAuth, requireWorkspace('execution'), executionController.startTaskToday);
router.post('/tasks/:taskId/request-inspection', requireAuth, requireWorkspace('execution'), executionController.requestInspection);
router.post('/tasks/:taskId/approve', requireAuth, requireWorkspace('execution'), executionController.approveTask);
router.post('/tasks/:taskId/progress', executionController.updateTaskProgress);
router.post('/:taskId/progress', executionController.updateTaskProgress);
router.patch('/tasks/:taskId', requireAuth, requireWorkspace('execution'), executionController.updateTaskProgress);
router.patch('/:taskId', requireAuth, requireWorkspace('execution'), executionController.updateTaskProgress);

// Typology Templates (2BHK / 3BHK Master Plans)
router.get('/typologies', executionController.getTypologyTemplates);
router.post('/typologies/:flatType/zones/:zoneId', requireAuth, requireWorkspace('execution'), executionController.saveTypologyTemplate);
router.post('/typologies/:flatType/propagate', requireAuth, requireWorkspace('execution'), executionController.propagateTypologyToFlats);

// Task Catalog Management (Add / Update / Delete micro-tasks and priorities)
router.post('/tasks/catalog', requireAuth, requireWorkspace('execution'), executionController.addTaskCatalogItem);
router.post('/catalog', requireAuth, requireWorkspace('execution'), executionController.addTaskCatalogItem);
router.patch('/tasks/catalog/:id', requireAuth, requireWorkspace('execution'), executionController.updateTaskCatalogItem);
router.patch('/catalog/:id', requireAuth, requireWorkspace('execution'), executionController.updateTaskCatalogItem);
router.delete('/tasks/catalog/:id', requireAuth, requireWorkspace('execution'), executionController.deleteTaskCatalogItem);
router.delete('/catalog/:id', requireAuth, requireWorkspace('execution'), executionController.deleteTaskCatalogItem);

module.exports = router;

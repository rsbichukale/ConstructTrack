const ExecutionService = require('./execution.service');

async function getTowerElevation(req, res, next) {
  try {
    const { siteId } = req.query;
    const flats = await ExecutionService.getTowerElevation(siteId ? Number(siteId) : 1);
    return res.json({ success: true, flats });
  } catch (err) {
    next(err);
  }
}

async function getFlatDetails(req, res, next) {
  try {
    const { id } = req.params;
    const flat = await ExecutionService.getFlatDetails(id);
    return res.json({ success: true, flat });
  } catch (err) {
    next(err);
  }
}

async function getFlatRoomDimensions(req, res, next) {
  try {
    const { id } = req.params;
    const dimensions = await ExecutionService.getFlatRoomDimensions(id);
    return res.json({ success: true, dimensions });
  } catch (err) {
    next(err);
  }
}

async function saveRoomDimensions(req, res, next) {
  try {
    const { id, zoneId } = req.params;
    const saved = await ExecutionService.saveRoomDimensions(id, zoneId, req.body);
    return res.json({ success: true, dimensions: saved });
  } catch (err) {
    next(err);
  }
}

async function assignContractor(req, res, next) {
  try {
    const { taskId } = req.params;
    const { contractorId } = req.body;
    const updated = await ExecutionService.assignContractor(taskId, contractorId);
    return res.json({ success: true, task: updated });
  } catch (err) {
    next(err);
  }
}

async function startTaskToday(req, res, next) {
  try {
    const { taskId } = req.params;
    const updated = await ExecutionService.startTaskToday(taskId);
    return res.json({ success: true, task: updated });
  } catch (err) {
    next(err);
  }
}

async function requestInspection(req, res, next) {
  try {
    const { taskId } = req.params;
    const updated = await ExecutionService.requestInspection(taskId);
    return res.json({ success: true, task: updated });
  } catch (err) {
    next(err);
  }
}

async function approveTask(req, res, next) {
  try {
    const { taskId } = req.params;
    const updated = await ExecutionService.approveTask(taskId);
    return res.json({ success: true, task: updated });
  } catch (err) {
    next(err);
  }
}

async function updateTaskProgress(req, res, next) {
  try {
    const { taskId } = req.params;
    const { status, completionPct, remarks } = req.body;
    const loggedBy = req.user?.name || req.user?.username || 'Site Engineer';

    const updated = await ExecutionService.updateTaskProgress(taskId, {
      status,
      completionPct: Number(completionPct) || 0,
      remarks,
      loggedBy
    });

    return res.json({ success: true, task: updated });
  } catch (err) {
    next(err);
  }
}

async function getTypologyTemplates(req, res, next) {
  try {
    const { siteId, flatType } = req.query;
    const templates = await ExecutionService.getTypologyTemplates(siteId ? Number(siteId) : 1, flatType || '3BHK');
    return res.json({ success: true, templates });
  } catch (err) {
    next(err);
  }
}

async function saveTypologyTemplate(req, res, next) {
  try {
    const { flatType, zoneId } = req.params;
    const { siteId } = req.query;
    const saved = await ExecutionService.saveTypologyTemplate(siteId ? Number(siteId) : 1, flatType, zoneId, req.body);
    return res.json({ success: true, template: saved });
  } catch (err) {
    next(err);
  }
}

async function propagateTypologyToFlats(req, res, next) {
  try {
    const { flatType } = req.params;
    const { siteId } = req.query;
    const result = await ExecutionService.propagateTypologyToFlats(siteId ? Number(siteId) : 1, flatType);
    return res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function addTaskCatalogItem(req, res, next) {
  try {
    const item = await ExecutionService.addTaskCatalogItem(req.body);
    return res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

async function updateTaskCatalogItem(req, res, next) {
  try {
    const { id } = req.params;
    const item = await ExecutionService.updateTaskCatalogItem(id, req.body);
    return res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

async function deleteTaskCatalogItem(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await ExecutionService.deleteTaskCatalogItem(id);
    return res.json({ success: true, deleted });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTowerElevation,
  getFlatDetails,
  getFlatRoomDimensions,
  saveRoomDimensions,
  assignContractor,
  startTaskToday,
  requestInspection,
  approveTask,
  updateTaskProgress,
  getTypologyTemplates,
  saveTypologyTemplate,
  propagateTypologyToFlats,
  addTaskCatalogItem,
  updateTaskCatalogItem,
  deleteTaskCatalogItem
};

const MachineryService = require('./machinery.service');

async function getAllAssets(req, res, next) {
  try {
    const { siteId } = req.query;
    const assets = await MachineryService.getAllAssets(siteId ? Number(siteId) : 1);
    return res.json({ success: true, assets });
  } catch (err) {
    next(err);
  }
}

async function registerAsset(req, res, next) {
  try {
    const asset = await MachineryService.registerAsset(req.body);
    return res.json({ success: true, asset });
  } catch (err) {
    next(err);
  }
}

async function updateAssetStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const asset = await MachineryService.updateStatus(id, status);
    return res.json({ success: true, asset });
  } catch (err) {
    next(err);
  }
}

async function getAllLogs(req, res, next) {
  try {
    const { siteId } = req.query;
    const logs = await MachineryService.getAllLogs(siteId ? Number(siteId) : 1);
    return res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
}

async function recordRunAndFuelLog(req, res, next) {
  try {
    const log = await MachineryService.recordRunAndFuelLog(req.body);
    return res.json({ success: true, log });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllAssets,
  registerAsset,
  updateAssetStatus,
  getAllLogs,
  recordRunAndFuelLog
};

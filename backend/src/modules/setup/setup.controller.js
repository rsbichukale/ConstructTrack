const SetupService = require('./setup.service');

async function getPresets(req, res, next) {
  try {
    const siteId = req.query.siteId ? Number(req.query.siteId) : 1;
    const presets = await SetupService.getPresets(siteId);
    return res.json({ success: true, presets });
  } catch (err) {
    next(err);
  }
}

async function initializeProject(req, res, next) {
  try {
    const result = await SetupService.initializeProject(req.body);
    return res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPresets,
  initializeProject
};

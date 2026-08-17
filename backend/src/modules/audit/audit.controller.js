const AuditService = require('./audit.service');

async function getLogs(req, res, next) {
  try {
    const { limit, entityType } = req.query;
    const logs = await AuditService.getLogs(limit, entityType);
    return res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
}

async function getTimeline(req, res, next) {
  try {
    const { entityType, entityId } = req.params;
    const timeline = await AuditService.getTimeline(entityType, entityId);
    return res.json({ success: true, entityType, entityId, timeline });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getLogs,
  getTimeline
};

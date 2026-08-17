const QASafetyService = require('./qa-safety.service');

async function getCubeTests(req, res, next) {
  try {
    const { wing, grade } = req.query;
    const tests = await QASafetyService.getCubeTests(wing, grade);
    return res.json({ success: true, tests });
  } catch (err) {
    next(err);
  }
}

async function recordCubeTest(req, res, next) {
  try {
    const test = await QASafetyService.recordCubeTest(req.body);
    return res.json({ success: true, test });
  } catch (err) {
    next(err);
  }
}

async function getSnags(req, res, next) {
  try {
    const { wing, status } = req.query;
    const snags = await QASafetyService.getSnags(wing, status);
    return res.json({ success: true, snags });
  } catch (err) {
    next(err);
  }
}

async function recordSnag(req, res, next) {
  try {
    const snag = await QASafetyService.recordSnag(req.body);
    return res.json({ success: true, snag });
  } catch (err) {
    next(err);
  }
}

async function resolveSnag(req, res, next) {
  try {
    const { id } = req.params;
    const { photoAfter, notes } = req.body;
    const snag = await QASafetyService.resolveSnag(id, photoAfter, notes);
    return res.json({ success: true, snag });
  } catch (err) {
    next(err);
  }
}

async function recordSafetyBriefing(req, res, next) {
  try {
    const briefing = await QASafetyService.recordSafetyBriefing(req.body);
    return res.json({ success: true, briefing });
  } catch (err) {
    next(err);
  }
}

async function getVisitors(req, res, next) {
  try {
    const { siteId } = req.query;
    const visitors = await QASafetyService.getVisitors(siteId ? Number(siteId) : 1);
    return res.json({ success: true, visitors, data: visitors });
  } catch (err) {
    next(err);
  }
}

async function recordVisitor(req, res, next) {
  try {
    const visitor = await QASafetyService.recordVisitor(req.body);
    return res.json({ success: true, visitor });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCubeTests,
  recordCubeTest,
  getSnags,
  recordSnag,
  resolveSnag,
  recordSafetyBriefing,
  getVisitors,
  recordVisitor
};

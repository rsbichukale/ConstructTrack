const SyncService = require('./sync.service');
const eventBus = require('../../lib/eventBus');

async function getFullState(req, res, next) {
  try {
    const siteId = req.query.siteId ? Number(req.query.siteId) : 1;
    const data = await SyncService.getFullState(siteId);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getSyncStatus(req, res, next) {
  try {
    const data = await SyncService.getSyncStatus();
    return res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

async function drainOutbox(req, res, next) {
  try {
    const { mutations } = req.body;
    const results = await SyncService.drainOutbox(mutations || []);
    return res.json({ success: true, results });
  } catch (err) {
    next(err);
  }
}

// Server-Sent Events (SSE) stream endpoint
function liveEventsStream(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  eventBus.addClient(res);
  res.write(`event: CONNECTED\ndata: ${JSON.stringify({ status: 'Connected to Site LAN Event Hub' })}\n\n`);
}

module.exports = {
  getFullState,
  getSyncStatus,
  drainOutbox,
  liveEventsStream
};

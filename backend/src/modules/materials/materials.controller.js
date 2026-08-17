const MaterialsService = require('./materials.service');

async function getInventory(req, res, next) {
  try {
    const data = await MaterialsService.getInventory();
    return res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

async function recordInward(req, res, next) {
  try {
    const record = await MaterialsService.recordInward(req.body);
    return res.json({ success: true, record });
  } catch (err) {
    next(err);
  }
}

async function recordOutward(req, res, next) {
  try {
    const record = await MaterialsService.recordOutward(req.body);
    return res.json({ success: true, record });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getInventory,
  recordInward,
  recordOutward
};

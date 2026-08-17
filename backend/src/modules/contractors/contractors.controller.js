const ContractorsService = require('./contractors.service');

async function getContractors(req, res, next) {
  try {
    const contractors = await ContractorsService.getAllContractors();
    return res.json({ success: true, contractors });
  } catch (err) {
    next(err);
  }
}

async function getDailyTargets(req, res, next) {
  try {
    const { date } = req.query;
    const targets = await ContractorsService.getDailyTargets(date);
    return res.json({ success: true, targets });
  } catch (err) {
    next(err);
  }
}

async function createDailyTarget(req, res, next) {
  try {
    const target = await ContractorsService.createDailyTarget(req.body);
    return res.json({ success: true, target });
  } catch (err) {
    next(err);
  }
}

async function updateDailyTarget(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const target = await ContractorsService.updateTargetStatus(id, status);
    return res.json({ success: true, target });
  } catch (err) {
    next(err);
  }
}

async function recordAttendance(req, res, next) {
  try {
    const attendance = await ContractorsService.recordAttendance(req.body);
    return res.json({ success: true, attendance });
  } catch (err) {
    next(err);
  }
}

async function getMusterRoll(req, res, next) {
  try {
    const { siteId, date } = req.query;
    const data = await ContractorsService.getMusterRoll(siteId ? Number(siteId) : 1, date);
    return res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

async function getAllWageAdvances(req, res, next) {
  try {
    const { siteId } = req.query;
    const data = await ContractorsService.getAllWageAdvances(siteId ? Number(siteId) : 1);
    return res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

async function createWageAdvance(req, res, next) {
  try {
    const advance = await ContractorsService.createWageAdvance(req.body);
    return res.json({ success: true, advance });
  } catch (err) {
    next(err);
  }
}

async function createContractor(req, res, next) {
  try {
    const contractor = await ContractorsService.createContractor(req.body);
    return res.json({ success: true, contractor });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getContractors,
  createContractor,
  getDailyTargets,
  createDailyTarget,
  updateDailyTarget,
  recordAttendance,
  getMusterRoll,
  getAllWageAdvances,
  createWageAdvance
};

const FinanceService = require('./finance.service');

async function getPettyCashEntries(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const data = await FinanceService.getPettyCashEntries(startDate, endDate);
    return res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

async function createPettyCashEntry(req, res, next) {
  try {
    const entry = await FinanceService.createPettyCashEntry(req.body);
    return res.json({ success: true, entry });
  } catch (err) {
    next(err);
  }
}

async function getClientChanges(req, res, next) {
  try {
    const changes = await FinanceService.getClientChanges();
    return res.json({ success: true, changes });
  } catch (err) {
    next(err);
  }
}

async function createClientChange(req, res, next) {
  try {
    const change = await FinanceService.createClientChange(req.body);
    return res.json({ success: true, change, request: change });
  } catch (err) {
    next(err);
  }
}

async function updateClientChangeStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const approver = req.user?.name || req.user?.username || 'Site Engineer';
    const change = await FinanceService.updateClientChangeStatus(id, status, approver);
    return res.json({ success: true, change });
  } catch (err) {
    next(err);
  }
}

async function approveClientChange(req, res, next) {
  try {
    const { id } = req.params;
    const { status, approvalType } = req.body;
    const approver = req.user?.name || req.user?.username || 'Approver';
    const change = await FinanceService.approveClientChange(id, status, approvalType, approver);
    return res.json({ success: true, change });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPettyCashEntries,
  createPettyCashEntry,
  getClientChanges,
  createClientChange,
  updateClientChangeStatus,
  approveClientChange
};

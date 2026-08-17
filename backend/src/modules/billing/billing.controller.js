const BillingService = require('./billing.service');

async function getAllBills(req, res, next) {
  try {
    const { siteId } = req.query;
    const bills = await BillingService.getAllBills(siteId ? Number(siteId) : 1);
    return res.json({ success: true, bills });
  } catch (err) {
    next(err);
  }
}

async function getBillDetails(req, res, next) {
  try {
    const { id } = req.params;
    const bill = await BillingService.getBillDetails(id);
    if (!bill) return res.status(404).json({ success: false, error: 'RA Bill not found' });
    return res.json({ success: true, bill });
  } catch (err) {
    next(err);
  }
}

async function previewRABill(req, res, next) {
  try {
    const { contractorId } = req.params;
    const preview = await BillingService.previewRABill(contractorId);
    return res.json({ success: true, preview });
  } catch (err) {
    next(err);
  }
}

async function generateRABill(req, res, next) {
  try {
    const bill = await BillingService.generateRABill(req.body);
    return res.json({ success: true, bill });
  } catch (err) {
    next(err);
  }
}

async function certifyBill(req, res, next) {
  try {
    const { id } = req.params;
    const certifier = req.user?.name || req.user?.username || 'QS / Billing Manager';
    const bill = await BillingService.certifyBill(id, certifier);
    return res.json({ success: true, bill });
  } catch (err) {
    next(err);
  }
}

async function recordPayment(req, res, next) {
  try {
    const { id } = req.params;
    const { paymentReference } = req.body;
    const bill = await BillingService.recordPayment(id, paymentReference);
    return res.json({ success: true, bill });
  } catch (err) {
    next(err);
  }
}

async function createDebitNote(req, res, next) {
  try {
    const note = await BillingService.createDebitNote(req.body);
    return res.json({ success: true, note });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllBills,
  getBillDetails,
  previewRABill,
  generateRABill,
  certifyBill,
  recordPayment,
  createDebitNote
};

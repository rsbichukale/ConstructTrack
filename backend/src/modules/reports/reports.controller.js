const ReportsService = require('./reports.service');

async function getDailyOperationalReport(req, res, next) {
  try {
    const { siteId, date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const data = await ReportsService.getDailyOperationalReport(targetDate, siteId ? Number(siteId) : 1);
    return res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

async function getConcreteQAReport(req, res, next) {
  try {
    const { siteId, wing, grade } = req.query;
    const data = await ReportsService.getConcreteQAReport(siteId ? Number(siteId) : 1, wing, grade);
    return res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

async function getSnaggingAuditReport(req, res, next) {
  try {
    const { siteId, wing, severity, status } = req.query;
    const data = await ReportsService.getSnaggingAuditReport(siteId ? Number(siteId) : 1, wing, severity, status);
    return res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

async function getMaterialReconciliationReport(req, res, next) {
  try {
    const { siteId, startDate, endDate } = req.query;
    const data = await ReportsService.getMaterialReconciliationReport(siteId ? Number(siteId) : 1, startDate, endDate);
    return res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

async function getContractorPerformanceReport(req, res, next) {
  try {
    const { siteId, startDate, endDate } = req.query;
    const data = await ReportsService.getContractorPerformanceReport(siteId ? Number(siteId) : 1, startDate, endDate);
    return res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

async function getPettyCashAuditReport(req, res, next) {
  try {
    const { siteId, startDate, endDate } = req.query;
    const data = await ReportsService.getPettyCashReport(siteId ? Number(siteId) : 1, startDate, endDate);
    return res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

async function getClientChangesCommercialReport(req, res, next) {
  try {
    const { siteId } = req.query;
    const data = await ReportsService.getClientChangesReport(siteId ? Number(siteId) : 1);
    return res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

async function getTowerExecutionMatrix(req, res, next) {
  try {
    const { siteId, wing } = req.query;
    const data = await ReportsService.getTowerExecutionMatrix(siteId ? Number(siteId) : 1, wing);
    return res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

async function getSitewiseTasksExport(req, res, next) {
  try {
    const { siteId, wing, tradeType, status, contractorId, format } = req.query;
    const result = await ReportsService.getSitewiseTasksExport(siteId ? Number(siteId) : 1, {
      wing,
      tradeType,
      status,
      contractorId
    });

    if (format === 'csv') {
      const csv = ReportsService.generateSitewiseCSV(result.tasks);
      const filename = `Sitewise_Tasks_Master_Export_${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(csv);
    }

    return res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDailyOperationalReport,
  getConcreteQAReport,
  getSnaggingAuditReport,
  getMaterialReconciliationReport,
  getContractorPerformanceReport,
  getPettyCashAuditReport,
  getClientChangesCommercialReport,
  getTowerExecutionMatrix,
  getTowerExecutionMatrixReport: getTowerExecutionMatrix,
  getSitewiseTasksExport
};

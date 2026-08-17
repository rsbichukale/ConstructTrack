const express = require('express');
const router = express.Router();
const reportsController = require('./reports.controller');

// 1. Daily Operational Report (DPR)
router.get('/dpr', reportsController.getDailyOperationalReport);
router.get('/daily-operational', reportsController.getDailyOperationalReport);

// 2. Concrete QA Lab Report
router.get('/concrete-qa', reportsController.getConcreteQAReport);

// 3. Snagging & Quality Defect Audit
router.get('/snagging-audit', reportsController.getSnaggingAuditReport);

// 4. Material Reconciliation
router.get('/material-reconciliation', reportsController.getMaterialReconciliationReport);

// 5. Contractor Performance & SLA
router.get('/contractor-performance', reportsController.getContractorPerformanceReport);

// 6. Petty Cash Audit
router.get('/petty-cash', reportsController.getPettyCashAuditReport);
router.get('/petty-cash-audit', reportsController.getPettyCashAuditReport);

// 7. Client Changes Commercial Margin
router.get('/client-changes', reportsController.getClientChangesCommercialReport);
router.get('/client-changes-commercial', reportsController.getClientChangesCommercialReport);

// 8. Tower Execution Matrix
router.get('/tower-matrix', reportsController.getTowerExecutionMatrixReport);
router.get('/tower-execution-matrix', reportsController.getTowerExecutionMatrixReport);

// 9. Sitewise Complete Tasks Master Export
router.get('/sitewise-tasks-export', reportsController.getSitewiseTasksExport);

module.exports = router;

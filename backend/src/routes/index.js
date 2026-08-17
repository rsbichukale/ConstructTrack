const express = require('express');
const router = express.Router();

// 1. Health & Site Diagnostics (Public)
const healthRoutes = require('../modules/health/health.routes');
router.use('/health', healthRoutes);

// State Snapshot (Direct Local PostgreSQL Database Dump)
const syncController = require('../modules/sync/sync.controller');
router.get('/state', syncController.getFullState);

// 2. Authentication & Identity
const authRoutes = require('../modules/auth/auth.routes');
router.use('/auth', authRoutes);

// 3. Execution (Flats, Wings, Floors, Micro-Tasks)
const executionRoutes = require('../modules/execution/execution.routes');
router.use('/execution', executionRoutes);
router.use('/flats', executionRoutes); // Alias
router.use('/tasks', executionRoutes); // Alias

// 4. Contractors & Workforce
const contractorsRoutes = require('../modules/contractors/contractors.routes');
router.use('/contractors', contractorsRoutes);
router.use('/workforce', contractorsRoutes); // Alias

// 5. Materials Store & Inventory
const materialsRoutes = require('../modules/materials/materials.routes');
router.use('/materials', materialsRoutes);

// 6. Heavy Plant Machinery & Fuel Tracker
const machineryRoutes = require('../modules/machinery/machinery.routes');
router.use('/machinery', machineryRoutes);

// 7. QA Lab & Site Safety
const qaSafetyRoutes = require('../modules/qa-safety/qa-safety.routes');
const qaController = require('../modules/qa-safety/qa-safety.controller');
router.use('/qa-safety', qaSafetyRoutes);
router.use('/quality', qaSafetyRoutes); // Alias
router.use('/safety', qaSafetyRoutes);  // Alias
router.get('/visitors', qaController.getVisitors);
router.post('/visitors', qaController.recordVisitor);
router.get('/snags', qaController.getSnags);

// 7. Finance, Cash & Client Variations
const financeRoutes = require('../modules/finance/finance.routes');
const financeController = require('../modules/finance/finance.controller');
router.use('/finance', financeRoutes);
router.use('/cash', financeRoutes); // Alias
router.use('/client-changes', financeRoutes); // Alias
router.use('/petty-cash', financeRoutes); // Alias
router.get('/client-changes', financeController.getClientChanges);

// 8. Subcontractor RA Billing Engine
const billingRoutes = require('../modules/billing/billing.routes');
router.use('/billing', billingRoutes);

// 9. Site Audit Trail & Compliance Ledger
const auditRoutes = require('../modules/audit/audit.routes');
router.use('/audit', auditRoutes);

// 10. 8 Enterprise Reports
const reportsRoutes = require('../modules/reports/reports.routes');
router.use('/reports', reportsRoutes);

// 11. Sync Engine & Realtime LAN SSE Stream
const syncRoutes = require('../modules/sync/sync.routes');
router.use('/sync', syncRoutes);

// 12. Project Onboarding & Setup Wizard
const setupRoutes = require('../modules/setup/setup.routes');
router.use('/setup', setupRoutes);

// 13. Document & Image Storage Engine API
const storageRoutes = require('../modules/storage/storage.routes');
router.use('/storage', storageRoutes);

// 14. 1-Click Automated Backup & Restore Engine
const backupRoutes = require('../modules/backup/backup.routes');
router.use('/backup', backupRoutes);

module.exports = router;

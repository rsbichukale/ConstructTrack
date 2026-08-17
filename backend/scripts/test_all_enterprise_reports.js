const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const reportsController = require('../src/modules/reports/reports.controller');

async function testAllReports() {
  console.log('================================================================');
  console.log('🧪 TESTING ALL 8 CONSTRUCTTRACK ENTERPRISE REPORTING ENDPOINTS');
  console.log('================================================================');

  const createMockRes = (name) => {
    return {
      json: (payload) => {
        if (!payload || !payload.success) {
          throw new Error(`Report [${name}] failed: ${JSON.stringify(payload)}`);
        }
        console.log(`✅ [${name}] Success! Summary:`, JSON.stringify(payload.summary || {}));
        return payload;
      },
      status: (code) => {
        return {
          json: (err) => {
            throw new Error(`Report [${name}] returned HTTP error status ${code}: ${JSON.stringify(err)}`);
          }
        };
      }
    };
  };

  const req = { query: { date: '2026-08-16' } };

  // 1. Daily Operational Report
  await reportsController.getDailyOperationalReport(req, createMockRes('Daily Operational'), (err) => { if (err) throw err; });

  // 2. Concrete QA Lab Report
  await reportsController.getConcreteQAReport(req, createMockRes('Concrete QA Lab'), (err) => { if (err) throw err; });

  // 3. Snagging Defect Audit Report
  await reportsController.getSnaggingAuditReport(req, createMockRes('Snagging Audit'), (err) => { if (err) throw err; });

  // 4. Material Reconciliation & Debits Report
  await reportsController.getMaterialReconciliationReport(req, createMockRes('Material Reconciliation'), (err) => { if (err) throw err; });

  // 5. Contractor Performance & SLA Report
  await reportsController.getContractorPerformanceReport(req, createMockRes('Contractor Performance'), (err) => { if (err) throw err; });

  // 6. Petty Cash Audit Report
  await reportsController.getPettyCashAuditReport(req, createMockRes('Petty Cash Audit'), (err) => { if (err) throw err; });

  // 7. Client Changes Commercial Margin Report
  await reportsController.getClientChangesCommercialReport(req, createMockRes('Client Changes Margin'), (err) => { if (err) throw err; });

  // 8. Tower & Floor Execution Matrix Report
  await reportsController.getTowerExecutionMatrixReport(req, createMockRes('Tower Execution Matrix'), (err) => { if (err) throw err; });

  console.log('================================================================');
  console.log('🎉 ALL 8 ENTERPRISE REPORTING ENDPOINTS TESTED AND VERIFIED OK!');
  console.log('================================================================');
}

testAllReports().then(() => process.exit(0)).catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

/**
 * ConstructTrack End-to-End System Verification Suite
 * Validates all backend modular endpoints, local database tables, and metrics.
 */

const express = require('express');
const http = require('http');
const db = require('../src/lib/db');
const apiRouter = require('../src/routes');

async function verifyEntireSystem() {
  console.log('================================================================');
  console.log('🧪 CONSTRUCTTRACK END-TO-END SYSTEM INTEGRATION VERIFICATION');
  console.log('================================================================\n');

  // 1. Direct PostgreSQL Database Checks
  console.log('1. Database Tables & Record Counts (constructtrack_db):');
  const countQueries = [
    ['Sites', 'SELECT COUNT(*) FROM sites'],
    ['Wings', 'SELECT COUNT(*) FROM wings'],
    ['Floors', 'SELECT COUNT(*) FROM floors'],
    ['Flats', 'SELECT COUNT(*) FROM flats'],
    ['Trades', 'SELECT COUNT(*) FROM trades'],
    ['Room Zones', 'SELECT COUNT(*) FROM room_zones'],
    ['Execution Phases', 'SELECT COUNT(*) FROM execution_phases'],
    ['Task Catalog', 'SELECT COUNT(*) FROM task_catalog'],
    ['Flat Tasks (Micro-Tasks)', 'SELECT COUNT(*) FROM flat_tasks'],
    ['Contractors', 'SELECT COUNT(*) FROM contractors'],
    ['Material Inventory', 'SELECT COUNT(*) FROM material_inventory'],
    ['Concrete Cube Tests', 'SELECT COUNT(*) FROM concrete_cube_tests'],
    ['Machinery Logs', 'SELECT COUNT(*) FROM machinery_logs'],
    ['Safety Briefings', 'SELECT COUNT(*) FROM safety_briefings'],
    ['App Users', 'SELECT COUNT(*) FROM app_users'],
    ['App Roles', 'SELECT COUNT(*) FROM app_roles']
  ];

  for (const [label, sql] of countQueries) {
    try {
      const res = await db.query(sql);
      const cnt = res.rows[0].count;
      console.log(`   ✅ ${label.padEnd(28)}: ${cnt} rows`);
    } catch (err) {
      console.error(`   ❌ ${label.padEnd(28)}: ERROR - ${err.message}`);
    }
  }

  // 2. Start Temporary Express Server to test all API Routes
  console.log('\n2. Testing Modular API Routes over HTTP:');
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(5099, resolve));
  const BASE_URL = 'http://localhost:5099/api';

  async function testRoute(name, method, endpoint, body) {
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer usr_admin' }
      };
      if (body) options.body = JSON.stringify(body);

      const res = await fetch(`${BASE_URL}${endpoint}`, options);
      const data = await res.json();

      if (res.ok && (data.success !== false)) {
        console.log(`   ✅ [HTTP ${res.status}] ${name.padEnd(35)} -> OK`);
        return true;
      } else {
        console.error(`   ❌ [HTTP ${res.status}] ${name.padEnd(35)} -> FAIL:`, data.error || data.message || data);
        return false;
      }
    } catch (err) {
      console.error(`   ❌ [ERROR]     ${name.padEnd(35)} -> ${err.message}`);
      return false;
    }
  }

  let passed = 0;
  let total = 0;

  const testCases = [
    ['Health Check', 'GET', '/health'],
    ['Site Diagnostics', 'GET', '/health/site-diagnostics'],
    ['Auth: Login', 'POST', '/auth/login', { email: 'admin@constructtrack.com', password: 'pass' }],
    ['Auth: Session', 'GET', '/auth/session'],
    ['Auth: Master Roles', 'GET', '/auth/roles'],
    ['Auth: Users List', 'GET', '/auth/users'],
    ['Execution: Flats Elevation', 'GET', '/execution/flats'],
    ['Execution: Flat 1 Details', 'GET', '/execution/flats/1'],
    ['Contractors: Roster', 'GET', '/contractors'],
    ['Contractors: Daily Targets', 'GET', '/contractors/targets'],
    ['Contractors: Multi-Skill Muster Roll', 'GET', '/contractors/muster'],
    ['Contractors: Wage Advances Ledger', 'GET', '/contractors/advances'],
    ['Machinery: Assets Registry', 'GET', '/machinery/assets'],
    ['Machinery: Runtime & Fuel Logs', 'GET', '/machinery/logs'],
    ['Materials: Inventory', 'GET', '/materials/inventory'],
    ['QA/Safety: Concrete Cubes', 'GET', '/qa-safety/cubes'],
    ['QA/Safety: Snagging List', 'GET', '/qa-safety/snags'],
    ['Finance: Petty Cash Ledger', 'GET', '/finance/petty-cash'],
    ['Finance: Client Variations', 'GET', '/finance/client-changes'],
    ['Report: 1. Daily Operational (DPR)', 'GET', '/reports/daily-operational'],
    ['Report: 2. Concrete QA Lab', 'GET', '/reports/concrete-qa'],
    ['Report: 3. Snagging Defect Audit', 'GET', '/reports/snagging-audit'],
    ['Report: 4. Material Store Audit', 'GET', '/reports/material-reconciliation'],
    ['Report: 5. Contractor Scorecard', 'GET', '/reports/contractor-performance'],
    ['Report: 6. Petty Cash Audit', 'GET', '/reports/petty-cash'],
    ['Report: 7. Commercial Variations', 'GET', '/reports/client-changes'],
    ['Report: 8. Tower Elevation Matrix', 'GET', '/reports/tower-matrix'],
    ['Sync: Hub Status & LAN Diagnostics', 'GET', '/sync/status']
  ];

  for (const tc of testCases) {
    total++;
    const ok = await testRoute(tc[0], tc[1], tc[2], tc[3]);
    if (ok) passed++;
  }

  await new Promise(resolve => server.close(resolve));

  console.log('\n================================================================');
  if (passed === total) {
    console.log(`🎉 SYSTEM HEALTH: 100% PERFECT! (${passed}/${total} checks passed)`);
  } else {
    console.log(`⚠️ SYSTEM HEALTH: ${passed}/${total} checks passed.`);
  }
  console.log('================================================================\n');

  process.exit(passed === total ? 0 : 1);
}

verifyEntireSystem().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

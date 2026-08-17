const db = require('../src/lib/db');

async function syncSequences() {
  const tables = [
    'material_inventory', 'material_inward_records', 'material_outward_records',
    'petty_cash_entries', 'concrete_cube_tests', 'snagging_items', 'machinery_logs',
    'machinery_assets', 'labor_wage_advances', 'daily_work_targets', 'contractor_ra_bills',
    'ra_bill_items', 'contractor_debit_notes', 'activity_audit_logs', 'flat_tasks', 'task_catalog', 'daily_progress_logs', 'client_change_requests'
  ];
  for (const t of tables) {
    try {
      const seqRes = await db.query(`SELECT pg_get_serial_sequence('${t}', 'id') as seq_name;`);
      const seqName = seqRes.rows[0]?.seq_name;
      if (seqName) {
        await db.query(`SELECT setval('${seqName}', COALESCE((SELECT MAX(id) FROM ${t}), 1));`);
        console.log(`Synced sequence for ${t} -> ${seqName}`);
      }
    } catch (e) {
      console.log(`Table ${t} uses manual or non-serial ID generation.`);
    }
  }
  console.log('All database sequences synchronized.');
  process.exit(0);
}

syncSequences().catch(e => { console.error(e); process.exit(1); });

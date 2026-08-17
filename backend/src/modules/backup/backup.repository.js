const db = require('../../lib/db');

const PARENT_TABLE_ORDER = [
  'sites',
  'wings',
  'floors',
  'flats',
  'trades',
  'room_zones',
  'typology_room_templates',
  'flat_typology_room_zones',
  'flat_room_dimensions',
  'execution_phases',
  'task_catalog',
  'contractors',
  'laborers',
  'app_roles',
  'app_users',
  'app_user_roles',
  'app_role_workspace_permissions',
  'flat_tasks',
  'daily_work_targets',
  'daily_progress_logs',
  'contractor_attendance',
  'department_attendance',
  'petty_cash_entries',
  'labor_wage_advances',
  'contractor_debit_notes',
  'contractor_ra_bills',
  'ra_bill_items',
  'material_inventory',
  'material_inward_records',
  'material_outward_records',
  'client_change_requests',
  'client_variation_changes',
  'machinery_assets',
  'machinery_logs',
  'concrete_cube_tests',
  'safety_briefings',
  'visitor_gate_passes',
  'activity_audit_logs',
  'schema_migrations'
];

class BackupRepository {
  static async getExistingTables() {
    const res = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE' 
      ORDER BY table_name;
    `);
    const allTables = res.rows.map(r => r.table_name);
    return PARENT_TABLE_ORDER.filter(t => allTables.includes(t));
  }

  static async exportFullDatabase() {
    const tables = await this.getExistingTables();
    const dump = {};
    const counts = {};

    for (const table of tables) {
      try {
        const res = await db.query(`SELECT * FROM "${table}";`);
        dump[table] = res.rows;
        counts[table] = res.rows.length;
      } catch (err) {
        console.warn(`[BackupRepository] Could not export table ${table}:`, err.message);
        dump[table] = [];
        counts[table] = 0;
      }
    }

    return { dump, counts, tables };
  }

  static async restoreFullDatabase(dump) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const tables = await this.getExistingTables();
      const reverseOrder = [...tables].reverse();

      for (const table of reverseOrder) {
        try {
          await client.query(`TRUNCATE TABLE "${table}" CASCADE;`);
        } catch (e) {
          console.warn(`[BackupRepository] Truncate notice for ${table}:`, e.message);
        }
      }

      // Re-insert data in parent dependency order (excluding GENERATED ALWAYS columns)
      for (const table of tables) {
        const rows = dump[table];
        if (rows && rows.length > 0) {
          const colRes = await client.query(
            `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND is_generated = 'NEVER';`,
            [table]
          );
          const writableCols = new Set(colRes.rows.map(r => r.column_name));

          for (const row of rows) {
            const validKeys = Object.keys(row).filter(k => writableCols.has(k));
            const values = validKeys.map(k => row[k]);
            const placeholders = validKeys.map((_, i) => `$${i + 1}`).join(', ');
            const columnList = validKeys.map(k => `"${k}"`).join(', ');

            await client.query(
              `INSERT INTO "${table}" (${columnList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING;`,
              values
            );
          }
        }
      }

      await client.query('COMMIT');
      return { success: true, message: 'Database restored successfully from backup archive.' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = BackupRepository;

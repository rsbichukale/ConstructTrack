const db = require('../../lib/db');
const eventBus = require('../../lib/eventBus');

class SyncService {
  static async getFullState(siteId = 1) {
    try {
      const [
        sitesRes,
        wingsRes,
        floorsRes,
        flatsRes,
        tradesRes,
        zonesRes,
        catalogRes,
        flatTasksRes,
        phasesRes,
        dimensionsRes,
        contractorsRes,
        inventoryRes,
        machineryRes
      ] = await Promise.all([
        db.query(`SELECT * FROM sites;`),
        db.query(`SELECT * FROM wings ORDER BY wing_code;`),
        db.query(`SELECT * FROM floors ORDER BY floor_number;`),
        db.query(`SELECT * FROM flats ORDER BY wing, floor_number, flat_number;`),
        db.query(`SELECT * FROM trades ORDER BY trade_name;`),
        db.query(`SELECT * FROM room_zones ORDER BY id;`),
        db.query(`SELECT * FROM task_catalog ORDER BY room_zone_id, sequence_order, id;`),
        db.query(`SELECT * FROM flat_tasks ORDER BY flat_id, sequence_order, id;`),
        db.query(`SELECT * FROM execution_phases ORDER BY phase_number, id;`),
        db.query(`SELECT * FROM flat_room_dimensions ORDER BY flat_id, room_zone_id;`),
        db.query(`SELECT * FROM contractors ORDER BY company_name;`),
        db.query(`SELECT * FROM material_inventory ORDER BY item_name;`),
        db.query(`SELECT * FROM machinery_assets ORDER BY asset_name;`)
      ]);

      return {
        sites: sitesRes.rows,
        wings: wingsRes.rows,
        floors: floorsRes.rows,
        flats: flatsRes.rows,
        trades: tradesRes.rows,
        roomZones: zonesRes.rows,
        taskCatalog: catalogRes.rows,
        flatTasks: flatTasksRes.rows,
        executionPhases: phasesRes.rows,
        roomDimensions: dimensionsRes.rows,
        contractors: contractorsRes.rows,
        inventory: inventoryRes.rows,
        machinery: machineryRes.rows,
        lastSyncedAt: new Date().toISOString()
      };
    } catch (err) {
      console.error('[SyncService.getFullState] Error:', err);
      throw err;
    }
  }

  static async getSyncStatus() {
    const counts = await Promise.all([
      db.query(`SELECT COUNT(*) FROM flats;`),
      db.query(`SELECT COUNT(*) FROM flat_tasks;`),
      db.query(`SELECT COUNT(*) FROM contractors;`),
      db.query(`SELECT COUNT(*) FROM material_inventory;`)
    ]);

    return {
      status: 'ONLINE',
      mode: 'LOCAL_POSTGRESQL',
      connectedClients: eventBus.getClientCount ? eventBus.getClientCount() : 0,
      counts: {
        flats: parseInt(counts[0].rows[0].count, 10),
        tasks: parseInt(counts[1].rows[0].count, 10),
        contractors: parseInt(counts[2].rows[0].count, 10),
        inventory: parseInt(counts[3].rows[0].count, 10),
      },
      timestamp: new Date().toISOString()
    };
  }

  static async drainOutbox(mutations = []) {
    const results = [];

    for (const m of mutations) {
      try {
        if (m.entity === 'flat_task' && m.action === 'UPDATE') {
          await db.query(`
            UPDATE flat_tasks 
            SET status = $1, completion_pct = $2, updated_at = NOW() 
            WHERE id = $3;
          `, [m.payload.status, m.payload.completionPct, m.payload.id]);

          results.push({ id: m.id, status: 'PROCESSED' });
        } else {
          results.push({ id: m.id, status: 'SKIPPED' });
        }
      } catch (err) {
        results.push({ id: m.id, status: 'ERROR', error: err.message });
      }
    }

    return results;
  }
}

module.exports = SyncService;

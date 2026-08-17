/**
 * Execution Repository - Encapsulates queries for flats, floors, wings, room zones, dimensions, and tasks
 */

const db = require('../../lib/db');

class ExecutionRepository {
  static async getAllFlats(siteId = 1) {
    const res = await db.query(`
      SELECT f.*, w.wing_name 
      FROM flats f
      LEFT JOIN wings w ON w.wing_code = f.wing AND w.site_id = f.site_id
      WHERE f.site_id = $1
      ORDER BY f.wing, f.floor_number, f.flat_number;
    `, [siteId]);
    return res.rows;
  }

  static async getFlatTasksByFlatId(flatId) {
    const res = await db.query(`
      SELECT ft.*, tc.task_name, tc.trade_type, tc.room_zone_id, tc.execution_phase_id,
             rz.zone_code, rz.zone_label, rz.icon_name,
             c.company_name as contractor_name, c.rate_per_sqft as contractor_rate_per_sqft
      FROM flat_tasks ft
      JOIN task_catalog tc ON tc.id = ft.task_catalog_id
      LEFT JOIN room_zones rz ON rz.id = tc.room_zone_id
      LEFT JOIN contractors c ON c.id = ft.assigned_contractor_id
      WHERE ft.flat_id = $1
      ORDER BY tc.execution_phase_id ASC, ft.id ASC;
    `, [flatId]);
    return res.rows;
  }

  static async getFlatRoomDimensions(flatId) {
    const res = await db.query(`
      SELECT d.*, rz.zone_label, rz.zone_code, rz.icon_name
      FROM flat_room_dimensions d
      JOIN room_zones rz ON rz.id = d.room_zone_id
      WHERE d.flat_id = $1
      ORDER BY d.room_zone_id;
    `, [flatId]);
    return res.rows;
  }

  static async saveRoomDimensions(flatId, roomZoneId, data) {
    const res = await db.query(`
      INSERT INTO flat_room_dimensions (
        site_id, flat_id, room_zone_id, length_ft, width_ft, height_ft, door_window_deduction_sqft, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (flat_id, room_zone_id) DO UPDATE SET
        length_ft = EXCLUDED.length_ft,
        width_ft = EXCLUDED.width_ft,
        height_ft = EXCLUDED.height_ft,
        door_window_deduction_sqft = EXCLUDED.door_window_deduction_sqft,
        updated_at = NOW()
      RETURNING *;
    `, [
      data.siteId || 1,
      flatId,
      roomZoneId,
      data.lengthFt || data.length_ft || 12.0,
      data.widthFt || data.width_ft || 10.0,
      data.heightFt || data.height_ft || 10.0,
      data.doorWindowDeductionSqft || data.door_window_deduction_sqft || 25.0
    ]);
    return res.rows[0];
  }

  static async assignContractor(taskId, contractorId) {
    const res = await db.query(`
      UPDATE flat_tasks
      SET assigned_contractor_id = $1, status = 'ASSIGNED', updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `, [contractorId, taskId]);
    return res.rows[0];
  }

  static async startTaskToday(taskId) {
    const res = await db.query(`
      UPDATE flat_tasks
      SET status = 'IN_PROGRESS', started_at = NOW(), completion_pct = GREATEST(completion_pct, 10), updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `, [taskId]);
    return res.rows[0];
  }

  static async requestInspection(taskId) {
    const res = await db.query(`
      UPDATE flat_tasks
      SET status = 'INSPECTION_PENDING', inspection_requested_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `, [taskId]);
    return res.rows[0];
  }

  static async approveTask(taskId) {
    const res = await db.query(`
      UPDATE flat_tasks
      SET status = 'APPROVED', completion_pct = 100, approved_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `, [taskId]);
    return res.rows[0];
  }

  static async updateTaskStatus(taskId, status, completionPct, remarks, loggedBy) {
    const taskRes = await db.query(`
      UPDATE flat_tasks 
      SET status = $1, completion_pct = $2, updated_at = NOW() 
      WHERE id = $3 
      RETURNING *;
    `, [status, completionPct, taskId]);

    if (taskRes.rows.length > 0) {
      await db.query(`
        INSERT INTO daily_progress_logs (flat_task_id, logged_by_user_id, date_logged, labor_count, completion_delta, notes)
        VALUES ($1, $2, NOW(), 1, $3, $4);
      `, [taskId, 1, completionPct, remarks || 'Progress updated']);
    }

    return taskRes.rows[0];
  }

  static async getTypologyTemplates(siteId = 1, flatType = '3BHK') {
    const res = await db.query(`
      SELECT t.*, rz.zone_label, rz.zone_code, rz.icon_name,
             (SELECT COUNT(*) FROM task_catalog tc WHERE tc.room_zone_id = t.room_zone_id) as tasks_count
      FROM typology_room_templates t
      JOIN room_zones rz ON rz.id = t.room_zone_id
      WHERE t.site_id = $1 AND t.flat_type = $2
      ORDER BY t.room_zone_id;
    `, [siteId, flatType]);
    return res.rows;
  }

  static async saveTypologyTemplate(siteId, flatType, roomZoneId, data) {
    const res = await db.query(`
      INSERT INTO typology_room_templates (
        site_id, flat_type, room_zone_id, length_ft, width_ft, height_ft, door_window_deduction_sqft, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (site_id, flat_type, room_zone_id) DO UPDATE SET
        length_ft = EXCLUDED.length_ft,
        width_ft = EXCLUDED.width_ft,
        height_ft = EXCLUDED.height_ft,
        door_window_deduction_sqft = EXCLUDED.door_window_deduction_sqft,
        updated_at = NOW()
      RETURNING *;
    `, [
      siteId || 1,
      flatType,
      roomZoneId,
      data.lengthFt || data.length_ft || 14.0,
      data.widthFt || data.width_ft || 12.0,
      data.heightFt || data.height_ft || 10.0,
      data.doorWindowDeductionSqft || data.door_window_deduction_sqft || 25.0
    ]);
    return res.rows[0];
  }

  static async propagateTypologyToFlats(siteId = 1, flatType = '3BHK') {
    // 1. Get all room templates for this typology
    const templatesRes = await db.query(`
      SELECT * FROM typology_room_templates WHERE site_id = $1 AND flat_type = $2;
    `, [siteId, flatType]);
    const templates = templatesRes.rows;

    // 2. Get all target flats
    const flatsRes = await db.query(`
      SELECT id, wing, flat_number, flat_type FROM flats WHERE site_id = $1 AND flat_type = $2;
    `, [siteId, flatType]);
    const targetFlats = flatsRes.rows;

    let propagatedDimensions = 0;
    let propagatedTasks = 0;

    for (const flat of targetFlats) {
      for (const t of templates) {
        // Sync dimensions
        await db.query(`
          INSERT INTO flat_room_dimensions (
            site_id, flat_id, room_zone_id, length_ft, width_ft, height_ft, door_window_deduction_sqft, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          ON CONFLICT (flat_id, room_zone_id) DO UPDATE SET
            length_ft = EXCLUDED.length_ft,
            width_ft = EXCLUDED.width_ft,
            height_ft = EXCLUDED.height_ft,
            door_window_deduction_sqft = EXCLUDED.door_window_deduction_sqft,
            updated_at = NOW();
        `, [siteId, flat.id, t.room_zone_id, t.length_ft, t.width_ft, t.height_ft, t.door_window_deduction_sqft]);
        propagatedDimensions++;

        // Ensure micro-tasks for this room zone exist
        const catalogTasks = await db.query(`
          SELECT id, trade_type FROM task_catalog WHERE room_zone_id = $1;
        `, [t.room_zone_id]);

        for (const catTask of catalogTasks.rows) {
          const insertTaskRes = await db.query(`
            INSERT INTO flat_tasks (flat_id, task_catalog_id, sequence_order, status, completion_pct, updated_at)
            VALUES ($1, $2, $3, 'NOT_STARTED', 0, NOW())
            ON CONFLICT DO NOTHING;
          `, [flat.id, catTask.id, catTask.sequence_order || 1]);
          if (insertTaskRes.rowCount > 0) propagatedTasks++;
        }
      }
    }

    return {
      flatType,
      targetFlatsCount: targetFlats.length,
      propagatedDimensionsCount: propagatedDimensions,
      newTasksCreatedCount: propagatedTasks
    };
  }

  static async addTaskCatalogItem(data) {
    const res = await db.query(`
      INSERT INTO task_catalog (
        task_name, trade_type, room_zone_id, sequence_order, priority, execution_phase_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `, [
      data.taskName || data.task_name,
      data.tradeType || data.trade_type || 'GENERAL',
      data.roomZoneId || data.room_zone_id,
      Number(data.sequenceOrder || data.sequence_order) || 1,
      data.priority || 'P2-HIGH',
      data.executionPhaseId || data.execution_phase_id || 1
    ]);
    return res.rows[0];
  }

  static async updateTaskCatalogItem(id, data) {
    const res = await db.query(`
      UPDATE task_catalog
      SET task_name = COALESCE($1, task_name),
          trade_type = COALESCE($2, trade_type),
          sequence_order = COALESCE($3, sequence_order),
          priority = COALESCE($4, priority)
      WHERE id = $5
      RETURNING *;
    `, [
      data.taskName || data.task_name,
      data.tradeType || data.trade_type,
      data.sequenceOrder !== undefined ? Number(data.sequenceOrder) : (data.sequence_order !== undefined ? Number(data.sequence_order) : null),
      data.priority,
      id
    ]);

    // Also update sequence_order in flat_tasks for this catalog item
    if (data.sequenceOrder !== undefined || data.sequence_order !== undefined) {
      const seq = Number(data.sequenceOrder || data.sequence_order || 1);
      await db.query(`UPDATE flat_tasks SET sequence_order = $1 WHERE task_catalog_id = $2;`, [seq, id]);
    }

    return res.rows[0];
  }

  static async deleteTaskCatalogItem(id) {
    const res = await db.query(`DELETE FROM task_catalog WHERE id = $1 RETURNING *;`, [id]);
    return res.rows[0];
  }
}

module.exports = ExecutionRepository;

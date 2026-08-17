/**
 * Reports Repository - Encapsulates pure SQL queries for all 8 enterprise reports
 */

const db = require('../../lib/db');

class ReportsRepository {
  // 1. Daily Operational Report Data
  static async getDailyOperationalData(targetDate, siteId = 1) {
    const [
      progressLogs,
      dailyTargets,
      contractorAttendance,
      contractors,
      deptAttendance,
      departmentLaborers,
      materialInward,
      materialOutward,
      machineryLogs,
      safetyBriefings,
      visitorPasses
    ] = await Promise.all([
      db.query(`
        SELECT l.*, t.task_name, f.flat_number, f.wing 
        FROM daily_progress_logs l
        LEFT JOIN flat_tasks ft ON ft.id = l.flat_task_id
        LEFT JOIN task_catalog t ON t.id = ft.task_catalog_id
        LEFT JOIN flats f ON f.id = ft.flat_id
        WHERE l.date_logged = $1;
      `, [targetDate]),

      db.query(`
        SELECT wt.*, c.company_name, c.trade_type 
        FROM daily_work_targets wt
        LEFT JOIN contractors c ON c.id = wt.contractor_id
        WHERE wt.date_assigned = $1;
      `, [targetDate]),

      db.query(`
        SELECT ca.*, c.company_name, c.trade_type 
        FROM contractor_attendance ca
        LEFT JOIN contractors c ON c.id = ca.contractor_id
        WHERE ca.date_logged = $1;
      `, [targetDate]),

      db.query(`SELECT id, company_name, trade_type, phone, contact_person FROM contractors WHERE status = 'ACTIVE';`),

      db.query(`
        SELECT da.*, l.name as laborer_name, l.skill_level 
        FROM department_attendance da
        LEFT JOIN laborers l ON l.id = da.laborer_id
        WHERE da.date_logged = $1;
      `, [targetDate]),

      db.query(`SELECT id, name, skill_level, daily_wage_rate FROM laborers WHERE is_department_labor = true;`),

      db.query(`SELECT * FROM material_inward_records WHERE received_date = $1;`, [targetDate]),
      db.query(`SELECT * FROM material_outward_records WHERE issued_date = $1;`, [targetDate]),
      db.query(`SELECT * FROM machinery_logs WHERE log_date = $1;`, [targetDate]),
      db.query(`SELECT * FROM safety_briefings WHERE briefing_date = $1;`, [targetDate]),
      db.query(`SELECT * FROM visitor_gate_passes WHERE DATE(entry_time) = $1;`, [targetDate])
    ]);

    return {
      progressLogs: progressLogs.rows,
      dailyTargets: dailyTargets.rows,
      contractorAttendance: contractorAttendance.rows,
      contractors: contractors.rows,
      deptAttendance: deptAttendance.rows,
      departmentLaborers: departmentLaborers.rows,
      materialInward: materialInward.rows,
      materialOutward: materialOutward.rows,
      machineryLogs: machineryLogs.rows,
      safetyBriefings: safetyBriefings.rows,
      visitorPasses: visitorPasses.rows
    };
  }

  // 2. Concrete Cube QA Tests Data
  static async getConcreteQAReportData(siteId = 1, wing, grade) {
    let sql = `SELECT * FROM concrete_cube_tests WHERE site_id = $1`;
    const params = [siteId];

    if (wing && wing !== 'ALL') {
      params.push(wing);
      sql += ` AND wing = $${params.length}`;
    }
    if (grade && grade !== 'ALL') {
      params.push(grade);
      sql += ` AND concrete_grade = $${params.length}`;
    }

    sql += ` ORDER BY casting_date DESC, id DESC;`;
    const res = await db.query(sql, params);
    return res.rows;
  }

  // 3. Snagging & Quality Defect Audit Data
  static async getSnaggingAuditData(siteId = 1, wing, severity, status) {
    let sql = `
      SELECT s.*, f.flat_number, f.wing, f.floor_number, rz.zone_label, c.company_name, c.trade_type
      FROM snagging_items s
      LEFT JOIN flats f ON f.id = s.flat_id
      LEFT JOIN room_zones rz ON rz.id = s.room_zone_id
      LEFT JOIN contractors c ON c.id = s.assigned_contractor_id
      WHERE f.site_id = $1
    `;
    const params = [siteId];

    if (wing && wing !== 'ALL') {
      params.push(wing);
      sql += ` AND f.wing = $${params.length}`;
    }
    if (status && status !== 'ALL') {
      params.push(status);
      sql += ` AND s.status = $${params.length}`;
    }

    sql += ` ORDER BY s.reported_at DESC;`;
    const res = await db.query(sql, params);
    return res.rows;
  }

  // 4. Material Reconciliation Data
  static async getMaterialReconciliationData(siteId = 1, startDate, endDate) {
    const [inventoryRes, inwardRes, outwardRes] = await Promise.all([
      db.query(`SELECT * FROM material_inventory ORDER BY category, item_name;`),
      db.query(`
        SELECT * FROM material_inward_records 
        WHERE site_id = $1 AND received_date >= $2 AND received_date <= $3
        ORDER BY received_date DESC;
      `, [siteId, startDate, endDate]),
      db.query(`
        SELECT o.*, c.company_name 
        FROM material_outward_records o
        LEFT JOIN contractors c ON c.id = o.issued_to_contractor_id
        WHERE o.site_id = $1 AND o.issued_date >= $2 AND o.issued_date <= $3
        ORDER BY o.issued_date DESC;
      `, [siteId, startDate, endDate])
    ]);

    return {
      inventory: inventoryRes.rows,
      inward: inwardRes.rows,
      outward: outwardRes.rows
    };
  }

  // 5. Contractor Performance & SLA Data
  static async getContractorPerformanceData(siteId = 1, startDate, endDate) {
    const [contractorsRes, attendanceRes, targetsRes] = await Promise.all([
      db.query(`SELECT * FROM contractors ORDER BY company_name;`),
      db.query(`
        SELECT * FROM contractor_attendance 
        WHERE date_logged >= $1 AND date_logged <= $2;
      `, [startDate, endDate]),
      db.query(`
        SELECT * FROM daily_work_targets 
        WHERE date_assigned >= $1 AND date_assigned <= $2;
      `, [startDate, endDate])
    ]);

    return {
      contractors: contractorsRes.rows,
      attendance: attendanceRes.rows,
      targets: targetsRes.rows
    };
  }

  // 6. Petty Cash Audit Data
  static async getPettyCashData(siteId = 1, startDate, endDate) {
    const res = await db.query(`
      SELECT * FROM petty_cash_entries 
      WHERE site_id = $1 AND entry_date >= $2 AND entry_date <= $3 
      ORDER BY entry_date DESC, id DESC;
    `, [siteId, startDate, endDate]);
    return res.rows;
  }

  // 7. Client Changes Commercial Margin Data
  static async getClientChangesData(siteId = 1) {
    const res = await db.query(`
      SELECT c.*, f.flat_number, f.wing, f.floor_number 
      FROM client_change_requests c
      LEFT JOIN flats f ON f.id = c.flat_id
      WHERE f.site_id = $1 OR c.flat_id IS NULL
      ORDER BY c.created_at DESC;
    `, [siteId]);
    return res.rows;
  }

  // 8. Tower Execution Matrix Data
  static async getTowerExecutionData(siteId = 1, wing) {
    let sql = `
      SELECT f.id as flat_id, f.wing, f.floor_number, f.flat_number, f.flat_type,
             COUNT(t.id) as total_tasks,
             COUNT(t.id) FILTER (WHERE t.status = 'APPROVED') as completed_tasks
      FROM flats f
      LEFT JOIN flat_tasks t ON t.flat_id = f.id
      WHERE f.site_id = $1
    `;
    const params = [siteId];

    if (wing && wing !== 'ALL') {
      params.push(wing);
      sql += ` AND f.wing = $${params.length}`;
    }

    sql += ` GROUP BY f.id, f.wing, f.floor_number, f.flat_number, f.flat_type ORDER BY f.wing, f.floor_number DESC, f.flat_number ASC;`;
    const res = await db.query(sql, params);
    return res.rows;
  }

  // 9. Sitewise Complete Micro-Tasks Master Export (6,832+ Records)
  static async getSitewiseAllTasksData(siteId = 1, filters = {}) {
    let sql = `
      SELECT 
        ft.id as task_id,
        s.name as project_name,
        f.wing,
        f.floor_number,
        f.flat_number,
        f.flat_type,
        COALESCE(rz.zone_label, 'General') as room_zone,
        COALESCE(ep.phase_name, 'Phase 1: Masonry & Finishing') as phase_name,
        ep.phase_number,
        tc.task_name,
        tc.trade_type,
        COALESCE(c.company_name, 'Unassigned') as contractor_name,
        COALESCE(c.contact_person, 'N/A') as contractor_lead,
        COALESCE(c.phone, 'N/A') as contractor_phone,
        COALESCE(c.rate_per_sqft, c.rate_per_unit, 25.00) as contractor_rate_sqft,
        COALESCE(d.length_ft, 14.00) as room_length_ft,
        COALESCE(d.width_ft, 12.00) as room_width_ft,
        COALESCE(d.height_ft, 10.00) as room_height_ft,
        COALESCE(d.door_window_deduction_sqft, 25.00) as deduction_sqft,
        COALESCE(
          CASE 
            WHEN tc.trade_type ILIKE '%PLASTER%' OR tc.trade_type ILIKE '%POP%' OR tc.trade_type ILIKE '%PAINT%' THEN d.wall_area_sqft
            WHEN tc.trade_type ILIKE '%SKIRTING%' OR tc.trade_type ILIKE '%ELECTRICAL%' OR tc.trade_type ILIKE '%PLUMBING%' THEN d.skirting_rft
            ELSE d.flooring_area_sqft
          END, 
          120.00
        ) as task_quantity,
        CASE
          WHEN tc.trade_type ILIKE '%SKIRTING%' OR tc.trade_type ILIKE '%ELECTRICAL%' OR tc.trade_type ILIKE '%PLUMBING%' THEN 'r.ft'
          ELSE 'sq.ft'
        END as unit_of_measure,
        COALESCE(ft.status, 'NOT_STARTED') as status,
        COALESCE(ft.completion_pct, 0) as completion_pct,
        ROUND(
          (COALESCE(
            CASE 
              WHEN tc.trade_type ILIKE '%PLASTER%' OR tc.trade_type ILIKE '%POP%' OR tc.trade_type ILIKE '%PAINT%' THEN d.wall_area_sqft
              WHEN tc.trade_type ILIKE '%SKIRTING%' OR tc.trade_type ILIKE '%ELECTRICAL%' OR tc.trade_type ILIKE '%PLUMBING%' THEN d.skirting_rft
              ELSE d.flooring_area_sqft
            END, 120.00) * (COALESCE(ft.completion_pct, 0) / 100.0) * COALESCE(c.rate_per_sqft, c.rate_per_unit, 25.00)
          )::numeric, 2
        ) as earned_amount,
        ft.started_at,
        ft.inspection_requested_at,
        ft.approved_at,
        ft.blocker_reason,
        ft.updated_at
      FROM flat_tasks ft
      JOIN flats f ON f.id = ft.flat_id
      JOIN sites s ON s.id = f.site_id
      JOIN task_catalog tc ON tc.id = ft.task_catalog_id
      LEFT JOIN room_zones rz ON rz.id = tc.room_zone_id
      LEFT JOIN execution_phases ep ON ep.id = tc.execution_phase_id
      LEFT JOIN contractors c ON c.id = ft.assigned_contractor_id
      LEFT JOIN flat_room_dimensions d ON d.flat_id = ft.flat_id AND d.room_zone_id = tc.room_zone_id
      WHERE f.site_id = $1
    `;
    const params = [siteId];

    if (filters.wing && filters.wing !== 'ALL') {
      params.push(filters.wing);
      sql += ` AND f.wing = $${params.length}`;
    }

    if (filters.tradeType && filters.tradeType !== 'ALL') {
      params.push(filters.tradeType);
      sql += ` AND tc.trade_type = $${params.length}`;
    }

    if (filters.status && filters.status !== 'ALL') {
      params.push(filters.status);
      sql += ` AND ft.status = $${params.length}`;
    }

    if (filters.contractorId && filters.contractorId !== 'ALL') {
      params.push(Number(filters.contractorId));
      sql += ` AND ft.assigned_contractor_id = $${params.length}`;
    }

    sql += ` ORDER BY f.wing, f.floor_number, f.flat_number, ep.phase_number NULLS LAST, tc.id;`;
    const res = await db.query(sql, params);
    return res.rows;
  }
}

module.exports = ReportsRepository;

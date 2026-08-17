const db = require('../../lib/db');

class ContractorsRepository {
  static async getAllContractors(siteId = 1) {
    const res = await db.query(`SELECT * FROM contractors ORDER BY status ASC, company_name ASC;`);
    return res.rows;
  }

  static async getDailyTargets(date) {
    const res = await db.query(`
      SELECT wt.*, c.company_name, c.trade_type 
      FROM daily_work_targets wt
      LEFT JOIN contractors c ON c.id = wt.contractor_id
      WHERE wt.date_assigned = $1
      ORDER BY wt.id DESC;
    `, [date]);
    return res.rows;
  }

  static async createDailyTarget(target) {
    const res = await db.query(`
      INSERT INTO daily_work_targets (
        contractor_id, wing, floor_number, trade_type, target_description, planned_labor_count, target_quantity_sqft, date_assigned, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ASSIGNED')
      RETURNING *;
    `, [
      target.contractorId,
      target.wing || 'B1',
      target.floorNumber || 1,
      target.tradeType || 'CIVIL',
      target.description || target.targetDescription || 'Daily Execution Target',
      (target.masons || 0) + (target.helpers || 0) || 6,
      target.targetQuantitySqft || 500,
      target.date || new Date().toISOString().split('T')[0]
    ]);
    return res.rows[0];
  }

  static async updateDailyTargetStatus(id, status) {
    const res = await db.query(`UPDATE daily_work_targets SET status = $1 WHERE id = $2 RETURNING *;`, [status, id]);
    const target = res.rows[0];

    // Cross-Module Automation: If target is verified/completed, advance matching flat tasks on that wing/floor
    if (target && (status === 'COMPLETED' || status === 'VERIFIED')) {
      const ftRes = await db.query(`
        UPDATE flat_tasks 
        SET status = CASE WHEN completion_pct >= 80 THEN 'INSPECTION_REQUESTED' ELSE 'IN_PROGRESS' END,
            completion_pct = LEAST(100, completion_pct + 20),
            updated_at = NOW()
        WHERE flat_id IN (SELECT id FROM flats WHERE wing = $1 AND floor_number = $2)
          AND (assigned_contractor_id = $3 OR assigned_contractor_id IS NULL)
        RETURNING id;
      `, [target.wing, target.floor_number, target.contractor_id]);

      // Log DPR entry for the first updated task
      if (ftRes.rows.length > 0) {
        await db.query(`
          INSERT INTO daily_progress_logs (
            flat_task_id, date_logged, completion_delta, labor_count, notes
          ) VALUES ($1, $2, 20, $3, $4);
        `, [
          ftRes.rows[0].id,
          target.date_assigned || new Date().toISOString().split('T')[0],
          target.planned_labor_count || 6,
          `Verified Daily Target: ${target.target_description}`
        ]);
      }
    }

    return target;
  }

  static async recordAttendance(attendance) {
    const id = Date.now();
    const res = await db.query(`
      INSERT INTO contractor_attendance (
        id, site_id, contractor_id, masons_count, helpers_count, 
        barbenders_count, carpenters_count, electricians_count, plumbers_count, 
        date_logged, is_present, work_assigned
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `, [
      id,
      attendance.siteId || 1,
      attendance.contractorId,
      attendance.masons || 0,
      attendance.helpers || 0,
      attendance.barbenders || 0,
      attendance.carpenters || 0,
      attendance.electricians || 0,
      attendance.plumbers || 0,
      attendance.date || new Date().toISOString().split('T')[0],
      attendance.isPresent !== false,
      attendance.workAssigned || null
    ]);
    return res.rows[0];
  }

  static async getMusterRoll(siteId = 1, date) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const res = await db.query(`
      SELECT 
        c.id as contractor_id,
        c.company_name,
        c.trade_type,
        c.contact_person,
        c.phone,
        COALESCE(ca.masons_count, 0) as masons_count,
        COALESCE(ca.helpers_count, 0) as helpers_count,
        COALESCE(ca.barbenders_count, 0) as barbenders_count,
        COALESCE(ca.carpenters_count, 0) as carpenters_count,
        COALESCE(ca.electricians_count, 0) as electricians_count,
        COALESCE(ca.plumbers_count, 0) as plumbers_count,
        COALESCE(ca.is_present, false) as is_present,
        ca.date_logged,
        ca.work_assigned
      FROM contractors c
      LEFT JOIN contractor_attendance ca ON ca.contractor_id = c.id AND ca.date_logged = $1
      WHERE c.status = 'ACTIVE'
      ORDER BY c.company_name ASC;
    `, [targetDate]);
    return res.rows;
  }

  // --- Labor Wage Advances (Kharcha) Ledger ---
  static async getAllWageAdvances(siteId = 1) {
    const res = await db.query(`
      SELECT lwa.*, c.company_name, c.trade_type, c.contact_person
      FROM labor_wage_advances lwa
      JOIN contractors c ON c.id = lwa.contractor_id
      WHERE lwa.site_id = $1
      ORDER BY lwa.disbursed_date DESC, lwa.id DESC;
    `, [siteId]);
    return res.rows;
  }

  static async createWageAdvance(data) {
    const voucherNo = `ADV-${data.contractorId}-${Date.now().toString().slice(-6)}`;
    const disbursedDate = data.disbursedDate || new Date().toISOString().split('T')[0];
    const amount = Number(data.amount);

    // 1. Fetch contractor name
    const contRes = await db.query(`SELECT company_name FROM contractors WHERE id = $1;`, [data.contractorId]);
    const companyName = contRes.rows[0]?.company_name || `Contractor #${data.contractorId}`;

    // 2. Auto-post Petty Cash EXPENSE entry
    const cashIdRes = await db.query(`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM petty_cash_entries;`);
    const pettyCashId = cashIdRes.rows[0].next_id;

    await db.query(`
      INSERT INTO petty_cash_entries (
        id, site_id, entry_type, category, amount, paid_to, description, voucher_number, entry_date, recorded_by
      ) VALUES ($1, $2, 'EXPENSE', 'LABOR_ADVANCE', $3, $4, $5, $6, $7, $8);
    `, [
      pettyCashId,
      data.siteId || 1,
      amount,
      companyName,
      `Wage Advance (Kharcha): ${data.purpose || 'Weekly Food & Labor Kharcha'} (Leader: ${data.disbursedToLeader})`,
      voucherNo,
      disbursedDate,
      data.disbursedBy || 'Site Accounts'
    ]);

    // 3. Insert Labor Wage Advance linked to Petty Cash
    const res = await db.query(`
      INSERT INTO labor_wage_advances (
        site_id, contractor_id, petty_cash_id, advance_voucher_no, amount, payment_mode,
        disbursed_to_leader, disbursed_by, disbursed_date, purpose, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'DISBURSED', $11)
      RETURNING *;
    `, [
      data.siteId || 1,
      data.contractorId,
      pettyCashId,
      voucherNo,
      amount,
      data.paymentMode || 'CASH',
      data.disbursedToLeader,
      data.disbursedBy || 'Site Accounts / PM',
      disbursedDate,
      data.purpose || 'Weekly Food & Labor Kharcha Advance',
      data.notes || null
    ]);
    return res.rows[0];
  }

  static async createContractor(data) {
    const res = await db.query(`
      INSERT INTO contractors (
        company_name, trade_type, contact_person, phone, rate_per_unit, status, wing_scope
      ) VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $6)
      RETURNING *;
    `, [
      data.companyName || data.company_name,
      data.tradeType || data.trade_type || 'GENERAL',
      data.supervisorName || data.contactPerson || data.contact_person || 'Supervisor',
      data.phoneNumber || data.phone || data.phone_number || `+91 ${Date.now().toString().slice(-10)}`,
      Number(data.ratePerSqft || data.ratePerUnit || data.rate_per_unit || data.rate_per_sqft) || 30,
      data.wingScope || data.wing_scope || 'ALL'
    ]);
    return res.rows[0];
  }

  static async deleteContractor(id) {
    const res = await db.query(`DELETE FROM contractors WHERE id = $1 RETURNING *;`, [id]);
    return res.rows[0];
  }

  static async createLaborer(data) {
    const res = await db.query(`
      INSERT INTO laborers (
        contractor_id, name, skill_level, phone, daily_wage_rate, is_department_labor
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `, [
      data.contractorId || data.contractor_id || null,
      data.name || 'Laborer',
      data.skillLevel || data.skill_level || 'HELPER',
      data.phone || null,
      Number(data.dailyWageRate || data.daily_wage_rate) || 500,
      data.isDepartmentLabor === true
    ]);
    return res.rows[0];
  }
}

module.exports = ContractorsRepository;

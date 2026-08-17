const db = require('../../lib/db');

class FinanceRepository {
  static async getPettyCashEntries(startDate, endDate) {
    const res = await db.query(`
      SELECT * FROM petty_cash_entries 
      WHERE entry_date >= $1 AND entry_date <= $2 
      ORDER BY entry_date DESC, id DESC;
    `, [startDate, endDate]);
    return res.rows;
  }

  static async createPettyCashEntry(entry) {
    const nextIdRes = await db.query(`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM petty_cash_entries;`);
    const id = nextIdRes.rows[0].next_id;

    const res = await db.query(`
      INSERT INTO petty_cash_entries (id, site_id, entry_type, category, amount, paid_to, description, voucher_number, entry_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `, [id, entry.siteId || 1, entry.entryType, entry.category, entry.amount, entry.paidTo, entry.description, entry.voucherNumber, entry.date || new Date().toISOString().split('T')[0]]);
    return res.rows[0];
  }

  static async getClientChanges() {
    const res = await db.query(`
      SELECT * FROM vw_client_changes_detailed
      ORDER BY created_at DESC, id DESC;
    `);
    return res.rows;
  }

  static async createClientChange(payload) {
    const nextIdRes = await db.query(`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM client_change_requests;`);
    const id = nextIdRes.rows[0].next_id;

    // 1. Fetch flat info
    const flatRes = await db.query(`SELECT wing, flat_number FROM flats WHERE id = $1;`, [payload.flatId]);
    const flat = flatRes.rows[0] || { wing: 'B1', flat_number: 101 };

    // 2. Fetch room zone info if provided
    let roomZoneLabel = payload.roomZoneLabel || null;
    let roomZoneId = payload.roomZoneId ? Number(payload.roomZoneId) : null;
    if (roomZoneId && !roomZoneLabel) {
      const rzRes = await db.query(`SELECT zone_label FROM room_zones WHERE id = $1;`, [roomZoneId]);
      if (rzRes.rows.length > 0) roomZoneLabel = rzRes.rows[0].zone_label;
    }

    const tradeType = payload.tradeType || 'ELECTRICAL';
    const contractorId = payload.contractorId ? Number(payload.contractorId) : null;
    const title = payload.requestTitle || payload.changeTitle || 'Custom Client Variation';
    const description = payload.scopeDetails || payload.changeDescription || '';
    const quotedAmount = Number(payload.quotedAmount || 0);
    const contractorCost = Number(payload.contractorCost || 0);
    const createMicroTask = payload.createMicroTask !== false; // default true

    let flatTaskId = null;

    // 3. Auto-create Micro-Task in Task Catalog and Flat Tasks if requested
    if (createMicroTask && roomZoneId) {
      const customTaskName = `[Client Custom] ${title}`;
      
      // Check if catalog item already exists or insert new
      let catalogRes = await db.query(`
        SELECT id FROM task_catalog 
        WHERE room_zone_id = $1 AND trade_type = $2 AND task_name = $3;
      `, [roomZoneId, tradeType, customTaskName]);

      let taskCatalogId;
      if (catalogRes.rows.length > 0) {
        taskCatalogId = catalogRes.rows[0].id;
      } else {
        const insertCatRes = await db.query(`
          INSERT INTO task_catalog (trade_type, task_name, room_zone_id, sequence_order, is_building_common)
          VALUES ($1, $2, $3, 99, false)
          RETURNING id;
        `, [tradeType, customTaskName, roomZoneId]);
        taskCatalogId = insertCatRes.rows[0].id;
      }

      // Upsert into flat_tasks for this flat
      const ftRes = await db.query(`
        INSERT INTO flat_tasks (flat_id, task_catalog_id, assigned_contractor_id, status, priority, completion_pct, total_quantity)
        VALUES ($1, $2, $3, 'NOT_STARTED', 'HIGH', 0, 1.0)
        ON CONFLICT (flat_id, task_catalog_id) 
        DO UPDATE SET assigned_contractor_id = COALESCE(EXCLUDED.assigned_contractor_id, flat_tasks.assigned_contractor_id)
        RETURNING id;
      `, [payload.flatId, taskCatalogId, contractorId]);

      if (ftRes.rows.length > 0) {
        flatTaskId = ftRes.rows[0].id;
      }
    }

    // 4. Insert into client_change_requests
    const res = await db.query(`
      INSERT INTO client_change_requests (
        id, flat_id, wing, flat_number, room_zone_id, room_zone_label,
        trade_type, contractor_id, flat_task_id, change_title, change_description,
        category, charge_head, quoted_amount, contractor_cost, impact_days,
        status, requested_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16,
        'APPROVED_FOR_EXECUTION', $17
      )
      RETURNING *;
    `, [
      id, payload.flatId, flat.wing, flat.flat_number, roomZoneId, roomZoneLabel,
      tradeType, contractorId, flatTaskId, title, description,
      payload.category || 'PAID_MINOR', payload.chargeHead || 'CLIENT_HEAD',
      quotedAmount, contractorCost, payload.impactDays || 0,
      payload.requestedBy || 'Buyer'
    ]);

    return res.rows[0];
  }

  static async updateClientChangeStatus(id, status, approvalField, approverName) {
    const res = await db.query(`
      UPDATE client_change_requests 
      SET status = $1, ${approvalField || 'engineer_approval'} = jsonb_build_object('approved', true, 'by', $2::text, 'at', NOW()::text), updated_at = NOW()
      WHERE id = $3
      RETURNING *;
    `, [status, approverName || 'Site Manager', id]);

    const updated = res.rows[0];

    // If change is completed, automatically approve the linked flat_task so contractor can bill for it in RA Bills!
    if (updated && updated.flat_task_id && (status === 'COMPLETED' || status === 'APPROVED')) {
      await db.query(`
        UPDATE flat_tasks 
        SET status = 'APPROVED', completion_pct = 100, updated_at = NOW() 
        WHERE id = $1;
      `, [updated.flat_task_id]);
    }

    return updated;
  }
}

module.exports = FinanceRepository;

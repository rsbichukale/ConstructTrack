const db = require('../../lib/db');

class BillingRepository {
  static async getAllBills(siteId = 1) {
    const res = await db.query(`
      SELECT b.*, c.company_name, c.trade_type
      FROM contractor_ra_bills b
      LEFT JOIN contractors c ON c.id = b.contractor_id
      WHERE b.site_id = $1
      ORDER BY b.created_at DESC;
    `, [siteId]);
    return res.rows;
  }

  static async getBillById(id) {
    const billRes = await db.query(`
      SELECT b.*, c.company_name, c.trade_type, c.contact_person, c.phone, c.rate_per_unit
      FROM contractor_ra_bills b
      LEFT JOIN contractors c ON c.id = b.contractor_id
      WHERE b.id = $1;
    `, [id]);

    if (billRes.rows.length === 0) return null;

    const itemsRes = await db.query(`
      SELECT * FROM ra_bill_items WHERE ra_bill_id = $1 ORDER BY id ASC;
    `, [id]);

    const debitRes = await db.query(`
      SELECT * FROM contractor_debit_notes WHERE ra_bill_id = $1;
    `, [id]);

    return {
      ...billRes.rows[0],
      items: itemsRes.rows,
      debitNotes: debitRes.rows
    };
  }

  static async getContractorApprovedTasks(contractorId) {
    const res = await db.query(`
      SELECT ft.id as flat_task_id, ft.status, ft.completion_pct,
             tc.task_name, tc.trade_type,
             f.flat_number, f.wing, f.floor_number,
             rz.zone_label,
             COALESCE(c.rate_per_sqft, c.rate_per_unit, 25.00) as rate_per_unit,
             COALESCE(
               CASE 
                 WHEN tc.trade_type ILIKE '%PLASTER%' OR tc.trade_type ILIKE '%POP%' OR tc.trade_type ILIKE '%PAINT%' THEN d.wall_area_sqft
                 WHEN tc.trade_type ILIKE '%SKIRTING%' OR tc.trade_type ILIKE '%ELECTRICAL%' OR tc.trade_type ILIKE '%PLUMBING%' THEN d.skirting_rft
                 ELSE d.flooring_area_sqft
               END, 
               120.00
             ) as calculated_quantity,
             CASE
               WHEN tc.trade_type ILIKE '%SKIRTING%' OR tc.trade_type ILIKE '%ELECTRICAL%' OR tc.trade_type ILIKE '%PLUMBING%' THEN 'r.ft'
               ELSE 'sq.ft'
             END as unit_of_measure
      FROM flat_tasks ft
      JOIN task_catalog tc ON tc.id = ft.task_catalog_id
      JOIN flats f ON f.id = ft.flat_id
      JOIN room_zones rz ON rz.id = tc.room_zone_id
      JOIN contractors c ON c.id = ft.assigned_contractor_id
      LEFT JOIN flat_room_dimensions d ON d.flat_id = ft.flat_id AND d.room_zone_id = tc.room_zone_id
      WHERE ft.assigned_contractor_id = $1 AND (ft.status = 'APPROVED' OR ft.status = 'COMPLETED' OR ft.status = 'VERIFIED')
      ORDER BY f.wing, f.floor_number, f.flat_number, tc.id;
    `, [contractorId]);
    return res.rows;
  }

  static async getPendingDebitNotes(contractorId) {
    const res = await db.query(`
      SELECT * FROM contractor_debit_notes 
      WHERE contractor_id = $1 AND status = 'PENDING';
    `, [contractorId]);
    return res.rows;
  }

  static async createRABill(bill, items, debitNoteIds = []) {
    const billRes = await db.query(`
      INSERT INTO contractor_ra_bills (
        site_id, bill_number, contractor_id, billing_period_start, billing_period_end,
        gross_amount, retention_pct, retention_amount, tds_pct, tds_amount,
        labor_cess_pct, labor_cess_amount, debit_notes_deducted, net_payable_amount,
        status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'DRAFT', $15)
      RETURNING *;
    `, [
      bill.siteId || 1, bill.billNumber, bill.contractorId, bill.startDate, bill.endDate,
      bill.grossAmount, bill.retentionPct || 5.0, bill.retentionAmount, bill.tdsPct || 1.0, bill.tdsAmount,
      bill.laborCessPct || 1.0, bill.laborCessAmount, bill.debitNotesDeducted, bill.netPayableAmount,
      bill.notes
    ]);

    const createdBill = billRes.rows[0];

    // Insert line items
    for (const item of items) {
      await db.query(`
        INSERT INTO ra_bill_items (ra_bill_id, flat_task_id, description, quantity, unit, rate, total_amount)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
      `, [createdBill.id, item.flatTaskId, item.description, item.quantity, item.unit, item.rate, item.totalAmount]);
    }

    // Mark debit notes as DEDUCTED
    if (debitNoteIds.length > 0) {
      await db.query(`
        UPDATE contractor_debit_notes 
        SET status = 'DEDUCTED', ra_bill_id = $1 
        WHERE id = ANY($2::bigint[]);
      `, [createdBill.id, debitNoteIds]);
    }

    // Auto-recover and mark DISBURSED wage advances as DEDUCTED_IN_RA_BILL
    await db.query(`
      UPDATE labor_wage_advances 
      SET status = 'DEDUCTED_IN_RA_BILL', linked_ra_bill_id = $1, updated_at = NOW() 
      WHERE contractor_id = $2 AND status = 'DISBURSED' AND disbursed_date <= $3;
    `, [createdBill.id, bill.contractorId, bill.endDate]);

    // Log Activity Audit
    await db.query(`
      INSERT INTO activity_audit_logs (
        site_id, entity_type, entity_id, action_type, actor_name, actor_role, summary
      ) VALUES ($1, 'RA_BILL', $2, 'CREATE', 'QS Billing Engineer', 'billing', $3);
    `, [bill.siteId || 1, createdBill.id.toString(), `Generated RA Bill #${bill.billNumber} (Gross: ₹${bill.grossAmount}, Net: ₹${bill.netPayableAmount})`]);

    return createdBill;
  }

  static async certifyBill(id, certifiedBy) {
    const res = await db.query(`
      UPDATE contractor_ra_bills
      SET status = 'CERTIFIED', certified_by = $1, certified_at = NOW(), updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `, [certifiedBy, id]);

    const certified = res.rows[0];
    if (certified) {
      await db.query(`
        INSERT INTO activity_audit_logs (
          site_id, entity_type, entity_id, action_type, actor_name, actor_role, summary
        ) VALUES ($1, 'RA_BILL', $2, 'CERTIFY', $3, 'project_director', $4);
      `, [certified.site_id || 1, id.toString(), certifiedBy, `Certified RA Bill #${certified.bill_number} for ₹${certified.net_payable_amount}`]);
    }

    return certified;
  }

  static async recordPayment(id, paymentReference) {
    const res = await db.query(`
      UPDATE contractor_ra_bills
      SET status = 'PAID', payment_reference = $1, paid_at = NOW(), updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `, [paymentReference, id]);

    const paid = res.rows[0];
    if (paid) {
      await db.query(`
        INSERT INTO activity_audit_logs (
          site_id, entity_type, entity_id, action_type, actor_name, actor_role, summary
        ) VALUES ($1, 'RA_BILL', $2, 'APPROVE', 'Accounts Manager', 'finance', $3);
      `, [paid.site_id || 1, id.toString(), `Disbursed Net Payment of ₹${paid.net_payable_amount} (Ref: ${paymentReference})`]);
    }

    return paid;
  }

  static async createDebitNote(note) {
    const nextNum = `DN-${Date.now().toString().slice(-6)}`;
    const res = await db.query(`
      INSERT INTO contractor_debit_notes (site_id, debit_note_number, contractor_id, category, amount, description, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
      RETURNING *;
    `, [note.siteId || 1, nextNum, note.contractorId, note.category || 'MATERIAL_OVERUSE', note.amount, note.description]);
    return res.rows[0];
  }
}

module.exports = BillingRepository;

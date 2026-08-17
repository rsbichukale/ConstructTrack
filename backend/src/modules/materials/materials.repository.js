const db = require('../../lib/db');

class MaterialsRepository {
  static async getInventory() {
    const res = await db.query(`SELECT * FROM material_inventory ORDER BY category, item_name;`);
    return res.rows;
  }

  static async recordInward(item) {
    const nextIdRes = await db.query(`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM material_inward_records;`);
    const id = nextIdRes.rows[0].next_id;

    const rate = Number(item.rate || item.rate_per_unit || 0);
    const quantity = Number(item.quantity || item.quantity_received || 0);
    const totalAmount = Number(item.totalAmount || item.total_amount || (quantity * rate));
    const receivedDate = item.date || item.receivedDate || item.received_date || new Date().toISOString().split('T')[0];

    const res = await db.query(`
      INSERT INTO material_inward_records (
        id, site_id, item_name, category, supplier_name, challan_number,
        vehicle_number, quantity_received, unit, rate_per_unit, total_amount, received_date, received_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `, [
      id,
      item.siteId || 1,
      item.itemName,
      item.category || 'General',
      item.supplier || item.supplier_name || 'Vendor',
      item.challanNo || item.challan_number || `CH-${Date.now().toString().slice(-6)}`,
      item.vehicleNo || item.vehicle_number || null,
      quantity,
      item.unit,
      rate,
      totalAmount,
      receivedDate,
      item.receivedBy || item.received_by || 'Store In-Charge'
    ]);

    // 1. Update material inventory stock (or upsert if new item)
    const invRes = await db.query(`
      UPDATE material_inventory 
      SET current_stock = current_stock + $1, updated_at = NOW() 
      WHERE item_name = $2
      RETURNING id;
    `, [quantity, item.itemName]);

    if (invRes.rows.length === 0) {
      await db.query(`
        INSERT INTO material_inventory (site_id, item_name, category, current_stock, unit, avg_rate_per_unit)
        VALUES ($1, $2, $3, $4, $5, $6);
      `, [item.siteId || 1, item.itemName, item.category || 'General', quantity, item.unit, rate]);
    }

    // 2. Cross-Module: If cash purchase on site, auto-post to Petty Cash
    if (item.paymentMode === 'CASH' || item.isCashPurchase) {
      const cashIdRes = await db.query(`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM petty_cash_entries;`);
      const pettyCashId = cashIdRes.rows[0].next_id;

      await db.query(`
        INSERT INTO petty_cash_entries (
          id, site_id, entry_type, category, amount, paid_to, description, voucher_number, entry_date, recorded_by
        ) VALUES ($1, $2, 'EXPENSE', 'MATERIAL_PURCHASE', $3, $4, $5, $6, $7, $8);
      `, [
        pettyCashId,
        item.siteId || 1,
        totalAmount,
        item.supplier || 'Vendor',
        `Site Cash Purchase: ${quantity} ${item.unit} of ${item.itemName} (Challan: ${item.challanNo || 'N/A'})`,
        `MAT-${id}`,
        receivedDate,
        item.receivedBy || 'Store In-Charge'
      ]);
    }

    return res.rows[0];
  }

  static async recordOutward(item) {
    const nextIdRes = await db.query(`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM material_outward_records;`);
    const id = nextIdRes.rows[0].next_id;

    let contractorName = item.contractorName || null;
    if (item.contractorId && !contractorName) {
      const cRes = await db.query(`SELECT company_name FROM contractors WHERE id = $1;`, [item.contractorId]);
      if (cRes.rows.length > 0) contractorName = cRes.rows[0].company_name;
    }

    let flatId = item.flatId ? Number(item.flatId) : null;
    let wing = item.wing || null;
    let floorNumber = item.floorNumber ? Number(item.floorNumber) : null;

    if (flatId && (!wing || !floorNumber)) {
      const fRes = await db.query(`SELECT wing, floor_number FROM flats WHERE id = $1;`, [flatId]);
      if (fRes.rows.length > 0) {
        wing = fRes.rows[0].wing;
        floorNumber = fRes.rows[0].floor_number;
      }
    }

    const res = await db.query(`
      INSERT INTO material_outward_records (
        id, site_id, flat_id, item_name, category, issued_to_contractor_id, contractor_name, wing, floor_number, purpose, quantity_issued, unit, issued_date, issued_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `, [
      id,
      item.siteId || 1,
      flatId,
      item.itemName,
      item.category || 'General',
      item.contractorId || null,
      contractorName,
      wing,
      floorNumber,
      item.purpose || 'Site Execution Scope',
      item.quantity,
      item.unit,
      item.date || new Date().toISOString().split('T')[0],
      item.issuedBy || 'Store In-Charge'
    ]);

    // Deduct stock
    await db.query(`
      UPDATE material_inventory 
      SET current_stock = GREATEST(0, current_stock - $1), updated_at = NOW() 
      WHERE item_name = $2;
    `, [item.quantity, item.itemName]);

    return res.rows[0];
  }
}

module.exports = MaterialsRepository;

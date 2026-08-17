const db = require('../../lib/db');

class MachineryRepository {
  static async getAllAssets(siteId = 1) {
    const res = await db.query(`
      SELECT 
        ma.*,
        COALESCE(
          (SELECT json_agg(ml) FROM (
            SELECT id, log_date, total_hours, diesel_issued_litres, fuel_efficiency_litres_per_hour, excess_fuel_flag, work_done, operator_name 
            FROM machinery_logs 
            WHERE asset_id = ma.id 
            ORDER BY log_date DESC, id DESC 
            LIMIT 5
          ) ml),
          '[]'::json
        ) as recent_logs
      FROM machinery_assets ma
      WHERE ma.site_id = $1
      ORDER BY ma.asset_type, ma.asset_name;
    `, [siteId]);
    return res.rows;
  }

  static async getAssetById(id) {
    const res = await db.query(`SELECT * FROM machinery_assets WHERE id = $1;`, [id]);
    return res.rows[0] || null;
  }

  static async createAsset(data) {
    const res = await db.query(`
      INSERT INTO machinery_assets (
        site_id, asset_name, asset_type, registration_no, operator_name, operator_phone,
        status, total_cumulative_hours, hourly_fuel_benchmark_litres, service_interval_hours,
        last_service_hours, last_service_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `, [
      data.siteId || 1,
      data.assetName,
      data.assetType,
      data.registrationNo || null,
      data.operatorName || null,
      data.operatorPhone || null,
      data.status || 'OPERATIONAL',
      data.totalCumulativeHours || 0,
      data.hourlyFuelBenchmarkLitres || 12.00,
      data.serviceIntervalHours || 250.00,
      data.lastServiceHours || 0,
      data.lastServiceDate || new Date().toISOString().split('T')[0]
    ]);
    return res.rows[0];
  }

  static async updateAssetStatus(id, status, notes = null) {
    const res = await db.query(`
      UPDATE machinery_assets 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING *;
    `, [status, id]);
    return res.rows[0];
  }

  static async getAllLogs(siteId = 1, limit = 50) {
    const res = await db.query(`
      SELECT ml.*, ma.asset_name, ma.asset_type, ma.hourly_fuel_benchmark_litres
      FROM machinery_logs ml
      LEFT JOIN machinery_assets ma ON ml.asset_id = ma.id
      WHERE ml.site_id = $1
      ORDER BY ml.log_date DESC, ml.id DESC
      LIMIT $2;
    `, [siteId, limit]);
    return res.rows;
  }

  static async createLog(data) {
    const id = Date.now();
    const res = await db.query(`
      INSERT INTO machinery_logs (
        id, site_id, asset_id, equipment_name, equipment_type, registration_no,
        operator_name, start_hours, end_hours, total_hours, diesel_issued_litres,
        fuel_efficiency_litres_per_hour, excess_fuel_flag, work_done, location, log_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *;
    `, [
      id,
      data.siteId || 1,
      data.assetId || null,
      data.equipmentName,
      data.equipmentType,
      data.registrationNo || null,
      data.operatorName || null,
      data.startHours || 0,
      data.endHours || 0,
      data.totalHours || 0,
      data.dieselIssuedLitres || 0,
      data.fuelEfficiencyLitresPerHour || 0,
      data.excessFuelFlag || false,
      data.workDone || null,
      data.location || null,
      data.logDate || new Date().toISOString().split('T')[0]
    ]);

    // Update cumulative hours on asset
    if (data.assetId && data.totalHours > 0) {
      await db.query(`
        UPDATE machinery_assets 
        SET total_cumulative_hours = total_cumulative_hours + $1, updated_at = NOW() 
        WHERE id = $2;
      `, [data.totalHours, data.assetId]);
    }

    // Auto-deduct Diesel from Material Inventory & log Outward slip
    const dieselLitres = Number(data.dieselIssuedLitres || 0);
    if (dieselLitres > 0) {
      // 1. Decrement Diesel in material_inventory
      await db.query(`
        UPDATE material_inventory 
        SET current_stock = GREATEST(0, current_stock - $1), updated_at = NOW()
        WHERE item_name ILIKE '%Diesel%' OR category = 'FUEL';
      `, [dieselLitres]);

      // 2. Insert into material_outward_records
      const outwardIdRes = await db.query(`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM material_outward_records;`);
      const outwardId = outwardIdRes.rows[0].next_id;

      await db.query(`
        INSERT INTO material_outward_records (
          id, site_id, item_name, category, contractor_name, purpose, quantity_issued, unit, issued_date, issued_by, remarks
        ) VALUES ($1, $2, 'High Speed Diesel (HSD)', 'FUEL', $3, $4, $5, 'Litres', $6, $7, $8);
      `, [
        outwardId,
        data.siteId || 1,
        data.operatorName || 'Plant Operator',
        `Equipment Fuel Refill: ${data.equipmentName} (${data.equipmentType})`,
        dieselLitres,
        data.logDate || new Date().toISOString().split('T')[0],
        'Store In-Charge / Fuel Dispenser',
        `Refill for ${data.workDone || 'Site Operations'} at ${data.location || 'Yard'}`
      ]);
    }

    return res.rows[0];
  }
}

module.exports = MachineryRepository;

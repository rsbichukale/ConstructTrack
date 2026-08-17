const db = require('../../lib/db');

class SetupRepository {
  static async getPresets(siteId = 1) {
    const [tradesRes, zonesRes, catalogRes, contractorsRes, phasesRes, materialsRes] = await Promise.all([
      db.query(`SELECT id, trade_code as "tradeCode", trade_name as "tradeName" FROM trades ORDER BY id;`),
      db.query(`SELECT id, zone_code as "zoneCode", zone_label as "zoneLabel", icon_name as "iconName" FROM room_zones ORDER BY id;`),
      db.query(`SELECT id, task_name as "taskName", trade_type as "tradeType", room_zone_id as "roomZoneId", execution_phase_id as "executionPhaseId", most_likely_days as "mostLikelyDays", sequence_order as "sequenceOrder" FROM task_catalog ORDER BY sequence_order, id;`),
      db.query(`SELECT id, company_name as "companyName", trade_type as "tradeType", contact_person as "contactPerson", phone, rate_per_unit as "ratePerUnit" FROM contractors ORDER BY company_name;`),
      db.query(`SELECT id, phase_name as "phaseName", phase_number as "phaseOrder" FROM execution_phases ORDER BY phase_number;`),
      db.query(`SELECT id, item_name as "itemName", category, current_stock as "currentStock", unit, min_reorder_level as "minReorderLevel", avg_rate_per_unit as "avgRatePerUnit" FROM material_inventory ORDER BY category, item_name;`)
    ]);

    const defaultMaterials = materialsRes.rows.length > 0 ? materialsRes.rows : [
      { itemName: 'Ultratech OPC 53 Grade Cement', category: 'CEMENT', currentStock: 500, unit: 'Bags', minReorderLevel: 100, avgRatePerUnit: 385 },
      { itemName: 'Tata Tiscon Fe 500D TMT Rebar (12mm)', category: 'STEEL', currentStock: 12, unit: 'MT', minReorderLevel: 3, avgRatePerUnit: 64500 },
      { itemName: 'Washed River Sand (Zone II)', category: 'AGGREGATE', currentStock: 45, unit: 'Brass', minReorderLevel: 10, avgRatePerUnit: 7800 },
      { itemName: 'High Speed Diesel (HSD) for Machinery', category: 'FUEL', currentStock: 1500, unit: 'Litres', minReorderLevel: 300, avgRatePerUnit: 92 },
      { itemName: 'Dr. Fixit 2K Polymer Waterproofing Coating', category: 'CHEMICALS', currentStock: 30, unit: 'Buckets (20kg)', minReorderLevel: 5, avgRatePerUnit: 2450 }
    ];

    const defaultMachinery = [
      { equipmentName: 'Tower Crane TC-01', equipmentType: 'Crane', modelNumber: 'Potain MC 85B', capacity: '5 Ton', status: 'OPERATIONAL', currentHours: 120 },
      { equipmentName: 'Passenger Hoist PH-01', equipmentType: 'Hoist', modelNumber: 'Spartan PM-2000', capacity: '2 Ton / 24 Persons', status: 'OPERATIONAL', currentHours: 85 },
      { equipmentName: 'Transit Concrete Mixer TM-01', equipmentType: 'Mixer', modelNumber: 'Schwing Stetter AM 6 FHC', capacity: '6 cu.m', status: 'OPERATIONAL', currentHours: 240 },
      { equipmentName: 'Backhoe Loader Excavator JCB-01', equipmentType: 'Earthmover', modelNumber: 'JCB 3DX Super', capacity: '0.24 cu.m Bucket', status: 'OPERATIONAL', currentHours: 310 },
      { equipmentName: 'Soundproof Diesel Generator DG-01', equipmentType: 'Generator', modelNumber: 'Cummins C125D5P', capacity: '125 kVA', status: 'OPERATIONAL', currentHours: 150 }
    ];

    const defaultHSE = {
      safetyOfficerName: 'R. K. Verma',
      emergencyHospital: 'Apollo Multispeciality Hospital (Contact: 022-27748888)',
      nearestAmbulance: 'Site Emergency Ambulance (Contact: 108 / 9820123456)',
      ppeBriefingTopics: ['Mandatory Hard Hats & High-Vis Vests', 'Double Lanyard Safety Harness on Slabs', 'Dust Masks & Goggles during Grinding']
    };

    const defaultPettyCash = {
      openingBalance: 50000,
      custodianName: 'Site Accounts Officer',
      dailyLimit: 15000
    };

    return {
      trades: tradesRes.rows,
      roomZones: zonesRes.rows,
      taskCatalog: catalogRes.rows,
      contractors: contractorsRes.rows,
      executionPhases: phasesRes.rows,
      materials: defaultMaterials,
      machinery: defaultMachinery,
      hse: defaultHSE,
      pettyCash: defaultPettyCash,
      typologyRoomMap: {
        '3BHK': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        '2BHK': [1, 2, 3, 4, 5, 6, 7, 8, 9],
        '1BHK': [1, 2, 4, 6, 7, 8, 9],
        '4BHK': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      }
    };
  }

  static async initializeProject(payload) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const siteId = payload.siteId || 1;
      const siteName = payload.siteName || 'ConstructTrack Horizon High-Rise';
      const location = payload.location || 'Plot 42, Sector 18';

      // 1. Upsert Site Identity
      await client.query(`
        INSERT INTO sites (id, name)
        VALUES ($1, $2)
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name;
      `, [siteId, siteName]);

      // 2. Wings, Floors & Flats Setup
      const wings = payload.wings && payload.wings.length > 0 ? payload.wings : ['B1', 'B2'];
      const floorsCount = Number(payload.floorsCount) || 7;
      const flatsPerFloor = Number(payload.flatsPerFloor) || 5;
      const flatTypologyRules = payload.flatTypologyRules || {};
      const customFlatTypologies = payload.customFlatTypologies || {};
      const typologyRoomMap = payload.typologyRoomMap || {};
      const taskCatalog = payload.taskCatalog || [];

      // Upsert Wings
      for (let i = 0; i < wings.length; i++) {
        const wingCode = typeof wings[i] === 'object' ? (wings[i].wing_code || wings[i].name) : wings[i];
        await client.query(`
          INSERT INTO wings (site_id, wing_code, wing_name)
          VALUES ($1, $2, $3)
          ON CONFLICT (site_id, wing_code) DO UPDATE
          SET wing_name = EXCLUDED.wing_name;
        `, [siteId, wingCode, `Wing ${wingCode}`]);
      }

      // Upsert Flats
      const createdFlatIds = [];
      for (const wingItem of wings) {
        const wingCode = typeof wingItem === 'object' ? (wingItem.wing_code || wingItem.name) : wingItem;
        for (let floor = 1; floor <= floorsCount; floor++) {
          for (let fn = 1; fn <= flatsPerFloor; fn++) {
            const flatNumber = `${floor}0${fn}`;
            const flatKey = `${wingCode}-${flatNumber}`;
            const typology = customFlatTypologies[flatKey] || flatTypologyRules[String(fn)] || '2BHK';

            const flatRes = await client.query(`
              INSERT INTO flats (site_id, wing, floor_number, flat_number, flat_type, updated_at)
              VALUES ($1, $2, $3, $4, $5, NOW())
              ON CONFLICT (site_id, wing, flat_number) DO UPDATE
              SET flat_type = EXCLUDED.flat_type, floor_number = EXCLUDED.floor_number, updated_at = NOW()
              RETURNING id;
            `, [siteId, wingCode, floor, flatNumber, typology]);

            const flatId = flatRes.rows[0].id;
            createdFlatIds.push({ flatId, wing: wingCode, floor, flatNumber, typology });
          }
        }
      }

      // 3. Materials Store Baseline Provisioning
      if (payload.materials && Array.isArray(payload.materials)) {
        for (const mat of payload.materials) {
          const checkMat = await client.query(`SELECT id FROM material_inventory WHERE site_id = $1 AND item_name = $2 LIMIT 1;`, [siteId, mat.itemName]);
          if (checkMat.rows.length > 0) {
            await client.query(`
              UPDATE material_inventory 
              SET current_stock = $1, avg_rate_per_unit = $2, updated_at = NOW() 
              WHERE id = $3;
            `, [Number(mat.currentStock) || 0, Number(mat.avgRatePerUnit) || 0, checkMat.rows[0].id]);
          } else {
            await client.query(`
              INSERT INTO material_inventory (site_id, item_name, category, current_stock, unit, min_reorder_level, avg_rate_per_unit, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, NOW());
            `, [siteId, mat.itemName, mat.category || 'GENERAL', Number(mat.currentStock) || 0, mat.unit || 'Units', Number(mat.minReorderLevel) || 10, Number(mat.avgRatePerUnit) || 0]);
          }
        }
      }

      // 4. Machinery Assets Baseline Provisioning
      if (payload.machinery && Array.isArray(payload.machinery)) {
        for (const mach of payload.machinery) {
          const name = mach.equipmentName || mach.assetName || 'Site Asset';
          const type = (mach.equipmentType || mach.assetType || 'PLANT').toUpperCase().replace(/\s+/g, '_');
          const checkMach = await client.query(`SELECT id FROM machinery_assets WHERE site_id = $1 AND asset_name = $2 LIMIT 1;`, [siteId, name]);
          if (checkMach.rows.length > 0) {
            await client.query(`
              UPDATE machinery_assets 
              SET total_cumulative_hours = $1, status = $2, updated_at = NOW() 
              WHERE id = $3;
            `, [Number(mach.currentHours) || 0, mach.status || 'OPERATIONAL', checkMach.rows[0].id]);
          } else {
            await client.query(`
              INSERT INTO machinery_assets (site_id, asset_name, asset_type, registration_no, status, total_cumulative_hours, hourly_fuel_benchmark_litres, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, 12.0, NOW());
            `, [siteId, name, type, mach.modelNumber || 'MH-REG-1001', mach.status || 'OPERATIONAL', Number(mach.currentHours) || 0]);
          }
        }
      }

      // 5. Petty Cash Opening Imprest Float Provisioning
      if (payload.pettyCash && payload.pettyCash.openingBalance > 0) {
        const cashIdRes = await client.query(`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM petty_cash_entries;`);
        const nextCashId = cashIdRes.rows[0].next_id;

        await client.query(`
          INSERT INTO petty_cash_entries (id, site_id, entry_type, category, amount, paid_to, description, voucher_number, entry_date, recorded_by)
          VALUES ($1, $2, 'TOP_UP', 'PROJECT_IMPREST', $3, $4, $5, $6, NOW(), $7);
        `, [
          nextCashId,
          siteId,
          Number(payload.pettyCash.openingBalance),
          payload.pettyCash.custodianName || 'Site Accounts Officer',
          `Initial Project Onboarding Opening Imprest Float (${siteName})`,
          `FLOAT-INIT-${Date.now().toString().slice(-4)}`,
          'Project Director'
        ]);
      }

      // 6. HSE Safety Briefing Baseline
      if (payload.hse) {
        const nextBriefingIdRes = await client.query(`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM safety_briefings;`);
        const nextBriefingId = nextBriefingIdRes.rows[0].next_id;

        await client.query(`
          INSERT INTO safety_briefings (id, site_id, topic, speaker_name, attendee_count, ppe_compliance_pct, briefing_date)
          VALUES ($1, $2, $3, $4, $5, 100, CURRENT_DATE);
        `, [
          nextBriefingId,
          siteId,
          'Initial Site Safety Induction & High-Rise PPE Protocols',
          payload.hse.safetyOfficerName || 'Lead Safety Officer',
          25
        ]);
      }

      // 7. Activity Audit Log Entry
      await client.query(`
        INSERT INTO activity_audit_logs (site_id, entity_type, entity_id, action_type, actor_name, actor_role, summary)
        VALUES ($1, 'SITE_SETUP', $2, 'INITIALIZE', 'Project Director', 'admin', $3);
      `, [siteId, siteId.toString(), `Successfully initialized ${siteName} with ${wings.length} wings, ${createdFlatIds.length} flats, store baseline, fleet registry, and HSE baseline.`]);

      await client.query('COMMIT');
      return {
        success: true,
        siteId,
        totalFlats: createdFlatIds.length,
        message: `Project ${siteName} successfully initialized in PostgreSQL with full operational baselines!`
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = SetupRepository;

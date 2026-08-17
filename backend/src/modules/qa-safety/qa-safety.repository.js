const db = require('../../lib/db');
const { StorageEngine } = require('../../lib/storageEngine');

class QASafetyRepository {
  static async getCubeTests(wing, grade) {
    let sql = `SELECT * FROM concrete_cube_tests WHERE 1=1`;
    const params = [];
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

  static async recordCubeTest(test) {
    const nextIdRes = await db.query(`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM concrete_cube_tests;`);
    const id = nextIdRes.rows[0].next_id;

    const actualMpa = Number(test.actualMpa || test.actual_strength_mpa || 0);
    const targetMpa = Number(test.targetMpa || test.target_strength_mpa || 25);
    const isPassed = actualMpa >= targetMpa && test.status !== 'FAILED';
    const finalStatus = isPassed ? 'PASSED' : 'FAILED';

    const res = await db.query(`
      INSERT INTO concrete_cube_tests (
        id, site_id, structural_member, wing, floor_number, concrete_grade,
        supplier_r_m_c, slump_mm, casting_date, test_age_days, test_date,
        target_strength_mpa, actual_strength_mpa, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `, [
      id,
      test.siteId || 1,
      test.member || test.structural_member || 'Slab / Column',
      test.wing || 'B1',
      test.floor || test.floor_number || 1,
      test.grade || test.concrete_grade || 'M25',
      test.supplier || test.supplier_r_m_c || 'RMC Plant',
      test.slump || test.slump_mm || 120,
      test.castingDate || test.casting_date,
      test.ageDays || test.test_age_days || 28,
      test.testDate || test.test_date || new Date().toISOString().split('T')[0],
      targetMpa,
      actualMpa,
      finalStatus
    ]);

    // Cross-Module Automation: If Cube Test Fails, auto-generate a high-priority Structural QA Snag!
    if (!isPassed) {
      // Find a representative flat on that wing & floor
      const flatRes = await db.query(`SELECT id FROM flats WHERE wing = $1 AND floor_number = $2 LIMIT 1;`, [test.wing || 'B1', test.floor || test.floor_number || 1]);
      const flatId = flatRes.rows[0]?.id || null;

      await db.query(`
        INSERT INTO snagging_items (
          flat_id, category, description, status, inspector_notes
        ) VALUES ($1, 'STRUCTURAL_CONCRETE_FAIL', $2, 'OPEN', $3);
      `, [
        flatId,
        `CRITICAL: Concrete ${test.ageDays || 28}D Cube Test Failed for ${test.member || 'Structural Element'} (${test.grade || 'M25'}). Actual: ${actualMpa} MPa vs Target: ${targetMpa} MPa.`,
        `RMC Supplier: ${test.supplier || 'RMC Plant'}, Casting Date: ${test.castingDate || test.casting_date}. Non-destructive rebound hammer or core extraction test required.`
      ]);
    }

    return res.rows[0];
  }

  static async getSnaggingItems(wing, status) {
    let sql = `
      SELECT s.*, f.flat_number, f.wing, f.floor_number, rz.zone_label, c.company_name
      FROM snagging_items s
      LEFT JOIN flats f ON f.id = s.flat_id
      LEFT JOIN room_zones rz ON rz.id = s.room_zone_id
      LEFT JOIN contractors c ON c.id = s.assigned_contractor_id
      WHERE 1=1
    `;
    const params = [];
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

  static async recordSnag(snag) {
    let flatTaskId = snag.flatTaskId ? Number(snag.flatTaskId) : null;

    // If flatTaskId not directly provided, find active task in that flat & room
    if (!flatTaskId && snag.flatId && snag.roomZoneId) {
      const ftRes = await db.query(`
        SELECT ft.id FROM flat_tasks ft
        JOIN task_catalog tc ON tc.id = ft.task_catalog_id
        WHERE ft.flat_id = $1 AND tc.room_zone_id = $2
        LIMIT 1;
      `, [snag.flatId, snag.roomZoneId]);
      if (ftRes.rows.length > 0) flatTaskId = ftRes.rows[0].id;
    }

    let finalPhotoUrl = snag.photoUrl;
    if (finalPhotoUrl && (finalPhotoUrl.startsWith('data:') || finalPhotoUrl.length > 300)) {
      try {
        const saved = await StorageEngine.saveFile({
          category: 'SNAGS',
          fileName: `Snag_Flat_${snag.flatId || 'General'}_BEFORE`,
          data: finalPhotoUrl
        });
        finalPhotoUrl = saved.relativeUrl;
      } catch (e) {
        console.warn('[StorageEngine] Failed to save snag photo:', e.message);
      }
    }

    const res = await db.query(`
      INSERT INTO snagging_items (flat_id, room_zone_id, flat_task_id, category, description, assigned_contractor_id, photo_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'OPEN')
      RETURNING *;
    `, [snag.flatId, snag.roomZoneId, flatTaskId, snag.category || 'Finishing', snag.description, snag.contractorId, finalPhotoUrl]);

    // Cross-Module: Set linked flat_task status to REWORK and set blocker_reason
    if (flatTaskId) {
      await db.query(`
        UPDATE flat_tasks 
        SET status = 'REWORK', blocker_reason = $1, updated_at = NOW() 
        WHERE id = $2;
      `, [`QA Defect Flagged: ${snag.description}`, flatTaskId]);
    }

    return res.rows[0];
  }

  static async resolveSnag(id, photoAfter, notes) {
    let finalPhotoAfter = photoAfter;
    if (finalPhotoAfter && (finalPhotoAfter.startsWith('data:') || finalPhotoAfter.length > 300)) {
      try {
        const saved = await StorageEngine.saveFile({
          category: 'SNAGS',
          fileName: `Snag_ID_${id}_RESOLVED`,
          data: finalPhotoAfter
        });
        finalPhotoAfter = saved.relativeUrl;
      } catch (e) {
        console.warn('[StorageEngine] Failed to save resolved snag photo:', e.message);
      }
    }

    const res = await db.query(`
      UPDATE snagging_items 
      SET status = 'RESOLVED', resolved_at = NOW(), resolved_photo_url = $1, inspector_notes = $2
      WHERE id = $3
      RETURNING *;
    `, [finalPhotoAfter, notes, id]);

    const resolved = res.rows[0];

    // Cross-Module: Clear blocker reason on flat_task and unlock for re-inspection
    if (resolved && resolved.flat_task_id) {
      await db.query(`
        UPDATE flat_tasks 
        SET status = 'INSPECTION_REQUESTED', blocker_reason = NULL, updated_at = NOW() 
        WHERE id = $1;
      `, [resolved.flat_task_id]);
    }

    return resolved;
  }

  static async recordSafetyBriefing(briefing) {
    const nextIdRes = await db.query(`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM safety_briefings;`);
    const id = nextIdRes.rows[0].next_id;

    const res = await db.query(`
      INSERT INTO safety_briefings (id, site_id, topic, speaker_name, attendee_count, ppe_compliance_pct, briefing_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `, [id, briefing.siteId || 1, briefing.topic, briefing.speaker, briefing.attendees || 0, briefing.compliance || 100, briefing.date || new Date().toISOString().split('T')[0]]);
    return res.rows[0];
  }

  static async getVisitors(siteId = 1) {
    const res = await db.query(`SELECT * FROM visitor_gate_passes WHERE site_id = $1 ORDER BY entry_time DESC;`, [siteId]);
    return res.rows;
  }

  static async recordVisitor(visitor) {
    const nextIdRes = await db.query(`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM visitor_gate_passes;`);
    const id = nextIdRes.rows[0].next_id;
    const passNumber = `GATE-PASS-${id}-${Date.now().toString().slice(-4)}`;

    const res = await db.query(`
      INSERT INTO visitor_gate_passes (
        id, site_id, visitor_name, visitor_phone, visitor_company, 
        purpose, person_to_meet, gate_pass_number, id_proof_type, id_proof_number,
        vehicle_number, entry_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *;
    `, [
      id,
      visitor.siteId || 1,
      visitor.visitorName || visitor.name,
      visitor.visitorPhone || visitor.phone || null,
      visitor.visitorCompany || visitor.company || null,
      visitor.purpose || 'Site Inspection',
      visitor.hostPerson || visitor.personToMeet || visitor.host || 'Project Manager',
      passNumber,
      visitor.idProofType || 'Aadhaar',
      visitor.idProofNumber || null,
      visitor.vehicleNumber || null
    ]);
    return res.rows[0];
  }
}

module.exports = QASafetyRepository;


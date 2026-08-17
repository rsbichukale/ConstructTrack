const db = require('../../lib/db');

class AuditRepository {
  static async logAction({ siteId = 1, entityType, entityId, actionType, actorName, actorRole, ipAddress, previousState, newState, summary }) {
    const res = await db.query(`
      INSERT INTO activity_audit_logs (
        site_id, entity_type, entity_id, action_type, actor_name, actor_role, ip_address, previous_state, new_state, summary
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `, [
      siteId, entityType, String(entityId), actionType, actorName || 'System', actorRole || 'site_engineer',
      ipAddress || '127.0.0.1', previousState ? JSON.stringify(previousState) : null,
      newState ? JSON.stringify(newState) : null, summary
    ]);
    return res.rows[0];
  }

  static async getLogs(limit = 100, entityType) {
    let sql = `SELECT * FROM activity_audit_logs WHERE 1=1`;
    const params = [];
    if (entityType && entityType !== 'ALL') {
      params.push(entityType);
      sql += ` AND entity_type = $${params.length}`;
    }
    params.push(limit);
    sql += ` ORDER BY created_at DESC LIMIT $${params.length};`;

    const res = await db.query(sql, params);
    return res.rows;
  }

  static async getTimeline(entityType, entityId) {
    const res = await db.query(`
      SELECT * FROM activity_audit_logs 
      WHERE entity_type = $1 AND entity_id = $2 
      ORDER BY created_at ASC, id ASC;
    `, [entityType, String(entityId)]);
    return res.rows;
  }
}

module.exports = AuditRepository;

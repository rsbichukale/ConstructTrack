const db = require('../../lib/db');

class AuthRepository {
  static async findUserByIdentifier(identifier) {
    const res = await db.query(`
      SELECT id, username, email, name, role, phone, contractor_id, is_email_verified
      FROM app_users
      WHERE LOWER(email) = $1 OR LOWER(username) = $1 OR id = $1
      LIMIT 1;
    `, [identifier]);
    return res.rows[0] || null;
  }

  static async createUser({ id, username, email, name, role, phone, contractorId }) {
    const res = await db.query(`
      INSERT INTO app_users (id, username, email, name, role, phone, contractor_id, is_email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING *;
    `, [id, username, email, name, role, phone, contractorId]);
    return res.rows[0];
  }

  static async getAllUsers() {
    const res = await db.query(`SELECT * FROM app_users ORDER BY created_at DESC;`);
    return res.rows;
  }

  static async updateUserRole(id, role) {
    const res = await db.query(`
      UPDATE app_users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *;
    `, [role, id]);
    return res.rows[0];
  }

  static async deleteUser(id) {
    const res = await db.query(`DELETE FROM app_users WHERE id = $1 RETURNING id;`, [id]);
    return res.rows[0];
  }

  static async getRolePermissions(roleCode) {
    const roleRes = await db.query(`SELECT * FROM app_roles WHERE role_code = $1;`, [roleCode]);
    const permRes = await db.query(`
      SELECT workspace_code FROM app_role_workspace_permissions 
      WHERE role_code = $1 AND can_access = true;
    `, [roleCode]);
    return {
      role: roleRes.rows[0] || null,
      permissions: permRes.rows.map(r => r.workspace_code)
    };
  }

  static async getAllRoles() {
    const rolesRes = await db.query(`SELECT * FROM app_roles ORDER BY display_order ASC;`);
    const permsRes = await db.query(`SELECT role_code, workspace_code FROM app_role_workspace_permissions WHERE can_access = true;`);
    const permMap = {};
    for (const r of permsRes.rows) {
      if (!permMap[r.role_code]) permMap[r.role_code] = [];
      permMap[r.role_code].push(r.workspace_code);
    }
    return rolesRes.rows.map(r => ({
      roleCode: r.role_code,
      roleName: r.role_name,
      description: r.description,
      isAssignable: r.is_assignable,
      displayOrder: r.display_order,
      workspacePermissions: permMap[r.role_code] || []
    }));
  }
}

module.exports = AuthRepository;

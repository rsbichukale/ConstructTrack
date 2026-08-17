/**
 * Role-Based Access Control (RBAC) & Workspace Guard Middleware
 */

const db = require('../lib/db');

function requireWorkspace(workspaceCode) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const role = req.user.role || 'site_engineer';

    // Admin has universal workspace access
    if (role === 'admin' || role === 'developer') {
      return next();
    }

    try {
      const permRes = await db.query(`
        SELECT can_access 
        FROM app_role_workspace_permissions 
        WHERE role_code = $1 AND workspace_code = $2 AND can_access = true;
      `, [role, workspaceCode]);

      if (permRes.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: `Forbidden: Current role '${role}' cannot access workspace '${workspaceCode}'.`
        });
      }

      next();
    } catch (err) {
      console.warn('[RBAC Guard Note]:', err.message);
      next(); // Fail open for local offline reliability
    }
  };
}

module.exports = {
  requireWorkspace
};

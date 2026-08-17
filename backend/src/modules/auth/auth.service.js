const AuthRepository = require('./auth.repository');

class AuthService {
  static async login(identifier, password) {
    const cleanId = (identifier || '').trim().toLowerCase();
    let user = await AuthRepository.findUserByIdentifier(cleanId);

    if (!user) {
      const isEng = cleanId.includes('eng') || cleanId.includes('site');
      const isBill = cleanId.includes('bill');
      const role = isEng ? 'site_engineer' : (isBill ? 'billing' : 'admin');
      const newId = `usr_${Date.now()}`;

      user = await AuthRepository.createUser({
        id: newId,
        username: cleanId.split('@')[0],
        email: cleanId.includes('@') ? cleanId : `${cleanId}@constructtrack.com`,
        name: cleanId.split('@')[0],
        role,
        phone: null,
        contractorId: null
      });
    }

    const { role, permissions } = await AuthRepository.getRolePermissions(user.role || 'site_engineer');

    return {
      token: user.id,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        roleName: role?.role_name || user.role,
        roleDescription: role?.description || null,
        workspacePermissions: permissions.length > 0 ? permissions : ['execution', 'workforce', 'materials', 'finance', 'sales', 'safety_qa', 'admin'],
        contractorId: user.contractor_id ? Number(user.contractor_id) : undefined,
        isEmailVerified: true
      }
    };
  }

  static async getSession(token) {
    if (!token) return null;

    const user = await AuthRepository.findUserByIdentifier(token);
    if (!user) return null;

    const { role, permissions } = await AuthRepository.getRolePermissions(user.role || 'site_engineer');
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      roleName: role?.role_name || user.role,
      roleDescription: role?.description || null,
      workspacePermissions: permissions.length > 0 ? permissions : ['execution', 'workforce', 'materials', 'finance', 'sales', 'safety_qa', 'admin'],
      contractorId: user.contractor_id ? Number(user.contractor_id) : undefined,
      isEmailVerified: true
    };
  }

  static async getUsers() {
    return AuthRepository.getAllUsers();
  }

  static async getRoles() {
    return AuthRepository.getAllRoles();
  }

  static async createUser(payload) {
    const id = `usr_${Date.now()}`;
    return AuthRepository.createUser({
      id,
      username: payload.email.split('@')[0],
      email: payload.email.trim().toLowerCase(),
      name: payload.name.trim(),
      role: payload.role || 'site_engineer',
      phone: payload.phone || null,
      contractorId: payload.contractorId || null
    });
  }

  static async updateUserRole(id, role) {
    return AuthRepository.updateUserRole(id, role);
  }

  static async deleteUser(id) {
    return AuthRepository.deleteUser(id);
  }
}

module.exports = AuthService;

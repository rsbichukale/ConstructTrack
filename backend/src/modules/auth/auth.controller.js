const AuthService = require('./auth.service');

async function login(req, res, next) {
  try {
    const { email, username, password } = req.body;
    const identifier = email || username;
    if (!identifier) {
      return res.status(400).json({ success: false, error: 'Email or username is required' });
    }
    const result = await AuthService.login(identifier, password);
    return res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function getSession(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.split(' ')[1] : null;
    const user = await AuthService.getSession(token);
    return res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

async function getUsers(req, res, next) {
  try {
    const users = await AuthService.getUsers();
    return res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
}

async function getRoles(req, res, next) {
  try {
    const roles = await AuthService.getRoles();
    return res.json({ success: true, roles });
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const user = await AuthService.createUser(req.body);
    return res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const user = await AuthService.updateUserRole(id, role);
    return res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    await AuthService.deleteUser(id);
    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  return res.json({ success: true, message: 'Logged out successfully' });
}

module.exports = {
  login,
  getSession,
  getUsers,
  getRoles,
  createUser,
  updateUserRole,
  deleteUser,
  logout
};

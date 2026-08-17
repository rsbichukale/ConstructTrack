const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { requireAuth, requireRoles } = require('../../middleware/authMiddleware');

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/session', authController.getSession);

// Master roles & User Management
router.get('/roles', authController.getRoles);
router.get('/users', requireAuth, authController.getUsers);
router.post('/users', requireAuth, requireRoles('admin'), authController.createUser);
router.patch('/users/:id/role', requireAuth, requireRoles('admin'), authController.updateUserRole);
router.delete('/users/:id', requireAuth, requireRoles('admin'), authController.deleteUser);

module.exports = router;

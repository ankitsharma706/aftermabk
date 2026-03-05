'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// All routes below require authentication
router.use(protect);

// ── Self (any authenticated user) ────────────────────────────────────────────
router.get('/me', ctrl.getMe);      // GET  /api/users/me
router.patch('/me', ctrl.updateMe);   // PATCH /api/users/me
router.delete('/me', ctrl.deleteMe);   // DELETE /api/users/me  (soft-deactivate)

// ── Admin only ───────────────────────────────────────────────────────────────
router.use(restrictTo('admin'));

router.get('/', ctrl.getAllUsers); // GET    /api/users?role=&phase=&active=&page=&limit=
router.get('/:id', ctrl.getUser);    // GET    /api/users/:id
router.patch('/:id', ctrl.updateUser); // PATCH  /api/users/:id
router.delete('/:id', ctrl.deleteUser); // DELETE /api/users/:id  (hard delete)

module.exports = router;

'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/doctor.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// ── Doctor self-service (requires doctor JWT) ────────────────────────────────
// IMPORTANT: these must be registered BEFORE /:id to avoid 'me' being treated as an ID
router.get('/me', protect, restrictTo('doctor'), ctrl.getMe);          // GET    /api/doctors/me
router.patch('/me', protect, restrictTo('doctor'), ctrl.updateMe);       // PATCH  /api/doctors/me
router.patch('/me/password', protect, restrictTo('doctor'), ctrl.changePassword); // PATCH  /api/doctors/me/password
router.delete('/me', protect, restrictTo('doctor'), ctrl.deleteMe);       // DELETE /api/doctors/me  (soft)

// ── Public routes (no auth needed) ──────────────────────────────────────────
router.get('/', ctrl.getAll);           // GET  /api/doctors?specialization=&location=&available=&page=&limit=
router.get('/:id', ctrl.getById);      // GET  /api/doctors/:id

// ── Admin only ───────────────────────────────────────────────────────────────
router.use(protect, restrictTo('admin'));

router.post('/', ctrl.create);               // POST   /api/doctors
router.patch('/:id', ctrl.update);           // PATCH  /api/doctors/:id
router.delete('/:id', ctrl.remove);          // DELETE /api/doctors/:id        (soft: active=false)
router.delete('/:id/hard', ctrl.hardDelete); // DELETE /api/doctors/:id/hard  (permanent)

module.exports = router;

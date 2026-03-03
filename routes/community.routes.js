'use strict';

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  createCommunity,
  getAllCommunities,
  getCommunityById,
  updateCommunity,
  deleteCommunity,
  joinCommunity,
  leaveCommunity,
} = require('../controllers/community.controller');

// GET  /api/communities       (public)
router.get('/', getAllCommunities);

// GET  /api/communities/:id   (public)
router.get('/:communityId', getCommunityById);

// POST /api/communities       (authenticated)
router.post(
  '/',
  protect,
  [
    body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title required (3–200 chars).'),
    body('category').optional().isIn([
      'Postpartum', 'Period Health', 'Mental Wellness', 'Nutrition', 'Exercise', 'General', 'Support',
    ]),
  ],
  validate,
  createCommunity
);

// PATCH /api/communities/:id   (admin)
router.patch('/:communityId', protect, restrictTo('admin'), updateCommunity);

// DELETE /api/communities/:id  (admin)
router.delete('/:communityId', protect, restrictTo('admin'), deleteCommunity);

// POST /api/communities/:id/join   (authenticated)
router.post('/:communityId/join', protect, joinCommunity);

// DELETE /api/communities/:id/leave  (authenticated)
router.delete('/:communityId/leave', protect, leaveCommunity);

module.exports = router;

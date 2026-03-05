'use strict';
const { Community } = require('../models');

// GET /api/communities
exports.getAll = async (req, res, next) => {
  try {
    const communities = await Community.find({ active: true }).sort({ member_count: -1 });
    return res.status(200).json({ status: 'success', results: communities.length, data: { communities } });
  } catch (err) { next(err); }
};

// PATCH /api/communities/:id/join
exports.join = async (req, res, next) => {
  try {
    const community = await Community.findByIdAndUpdate(
      req.params.id,
      { $inc: { member_count: 1 } },
      { returnDocument: 'after' }
    );
    if (!community) return res.status(404).json({ status: 'error', message: 'Community not found.' });
    return res.status(200).json({ status: 'success', data: { community } });
  } catch (err) { next(err); }
};

// PATCH /api/communities/:id/leave
exports.leave = async (req, res, next) => {
  try {
    const community = await Community.findByIdAndUpdate(
      req.params.id,
      { $inc: { member_count: -1 } },
      { returnDocument: 'after' }
    );
    if (!community) return res.status(404).json({ status: 'error', message: 'Community not found.' });
    return res.status(200).json({ status: 'success', data: { community } });
  } catch (err) { next(err); }
};

'use strict';

const { Community, CommunityMember } = require('../models');
const { parsePagination, paginateMeta } = require('../utils/helpers');
const { createError } = require('../middleware/error.middleware');

const createCommunity = async (req, res, next) => {
  try {
    const community = await Community.create({
      ...req.body,
      created_by: req.user._id,
      member_count: 1,
    });

    await CommunityMember.create({
      community_id: community._id,
      user_id: req.user._id,
      role: 'admin',
    });

    return res.status(201).json({ status: 'success', data: { community } });
  } catch (error) {
    next(error);
  }
};

const getAllCommunities = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { category, search, active } = req.query;

    const query = {};
    if (category) query.category = category;
    if (active !== undefined) query.active = active === 'true';
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { short_description: { $regex: search, $options: 'i' } },
      ];
    }

    const count = await Community.countDocuments(query);
    const communities = await Community.find(query)
      .sort({ member_count: -1, createdAt: -1 })
      .skip(offset)
      .limit(limit);

    return res.status(200).json({
      status: 'success',
      data: { communities, meta: paginateMeta(count, page, limit) },
    });
  } catch (error) {
    next(error);
  }
};

const getCommunityById = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.communityId);
    if (!community) return next(createError('Community not found.', 404));
    return res.status(200).json({ status: 'success', data: { community } });
  } catch (error) {
    next(error);
  }
};

const updateCommunity = async (req, res, next) => {
  try {
    const { created_by, member_count, post_count, ...updates } = req.body;
    const community = await Community.findByIdAndUpdate(
      req.params.communityId,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );
    if (!community) return next(createError('Community not found.', 404));
    return res.status(200).json({ status: 'success', data: { community } });
  } catch (error) {
    next(error);
  }
};

const deleteCommunity = async (req, res, next) => {
  try {
    const community = await Community.findByIdAndDelete(req.params.communityId);
    if (!community) return next(createError('Community not found.', 404));

    // Also cleanup members
    await CommunityMember.deleteMany({ community_id: community._id });

    return res.status(200).json({ status: 'success', message: 'Community deleted.' });
  } catch (error) {
    next(error);
  }
};

const joinCommunity = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.communityId);
    if (!community) return next(createError('Community not found.', 404));

    const already = await CommunityMember.findOne({
      community_id: community._id,
      user_id: req.user._id,
    });
    if (already) return next(createError('Already a member of this community.', 409));

    await CommunityMember.create({
      community_id: community._id,
      user_id: req.user._id,
    });

    await Community.findByIdAndUpdate(community._id, { $inc: { member_count: 1 } });

    return res.status(200).json({ status: 'success', message: 'Joined community successfully.' });
  } catch (error) {
    next(error);
  }
};

const leaveCommunity = async (req, res, next) => {
  try {
    const member = await CommunityMember.findOneAndDelete({
      community_id: req.params.communityId,
      user_id: req.user._id,
    });

    if (!member) return next(createError('You are not a member of this community.', 404));

    await Community.findByIdAndUpdate(req.params.communityId, { $inc: { member_count: -1 } });

    return res.status(200).json({ status: 'success', message: 'Left community.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCommunity, getAllCommunities, getCommunityById,
  updateCommunity, deleteCommunity, joinCommunity, leaveCommunity,
};

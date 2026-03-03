'use strict';

const mongoose = require('mongoose');

const communityMemberSchema = new mongoose.Schema({
  community_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['member', 'moderator', 'admin'],
    default: 'member',
  },
  joined_at: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

communityMemberSchema.index({ community_id: 1, user_id: 1 }, { unique: true });

const CommunityMember = mongoose.model('CommunityMember', communityMemberSchema);
module.exports = CommunityMember;

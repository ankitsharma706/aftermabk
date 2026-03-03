'use strict';

const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 200,
  },
  short_description: {
    type: String,
  },
  full_description: {
    type: String,
  },
  category: {
    type: String,
    enum: [
      'Postpartum',
      'Period Health',
      'Mental Wellness',
      'Nutrition',
      'Exercise',
      'General',
      'Support',
    ],
    default: 'General',
  },
  cover_image_url: {
    type: String,
  },
  tags: {
    type: [String],
    default: [],
  },
  member_count: {
    type: Number,
    default: 0,
    min: 0,
  },
  post_count: {
    type: Number,
    default: 0,
    min: 0,
  },
  is_private: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: true,
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

communitySchema.index({ category: 1 });
communitySchema.index({ active: 1 });
communitySchema.index({ title: 1 });

const Community = mongoose.model('Community', communitySchema);
module.exports = Community;

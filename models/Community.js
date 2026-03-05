'use strict';
const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  short_description: { type: String },
  category: { type: String },
  member_count: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
}, {
  timestamps: true,
  collection: 'communities',
});

module.exports = mongoose.model('Community', communitySchema);

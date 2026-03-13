'use strict';
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  user: { type: String, required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: { type: String, required: true },
  upvotes: { type: Number, default: 0 },
  is_doctor_verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const questionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, trim: true },
  category: {
    type: String,
    required: true,
    enum: ['Period', 'Pregnancy', 'Postpartum', 'Health', 'Mental Wellness', 'Nutrition', 'Fitness', 'General'],
    default: 'General',
  },
  author: { type: String, required: true },
  author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags: [{ type: String, trim: true }],
  answers: [answerSchema],
  upvotes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
}, {
  timestamps: true,
  collection: 'questions',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for answer count
questionSchema.virtual('answersCount').get(function () {
  return this.answers ? this.answers.length : 0;
});

// Index for search and filtering
questionSchema.index({ category: 1, createdAt: -1 });
questionSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Question', questionSchema);

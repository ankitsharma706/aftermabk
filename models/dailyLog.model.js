'use strict';

const mongoose = require('mongoose');

// Schema for individual log entries within the array
const logEntrySchema = new mongoose.Schema({
  log_id: { type: String },
  date: { type: Date },
  journal_entry1: { type: String },
  journal_entry_duration1: { type: String },
  journal_entry_intesitity1: { type: String },  // Note: keeping exact spelling from json
  journal_entry2: { type: String },
  journal_entry_duration2: { type: String },
  journal_entry_intesitity2: { type: String },
  journal_entry3: { type: String },
  journal_entry_duration3: { type: String },
  journal_entry_intesitity3: { type: String },
  journal_entry4: { type: String },
  journal_entry_duration4: { type: String },
  journal_entry_intesitity4: { type: String },
  journal_entry5: { type: String },
  journal_entry_duration5: { type: String },
  journal_entry_intesitity5: { type: String },
}, { _id: false });

// Schema for the summary object
const summarySchema = new mongoose.Schema({
  logs_recorded: { type: Number },
  average_sleep_hours: { type: Number },
  average_water_cups: { type: Number },
  average_pain_level: { type: Number },
  average_mood_score: { type: Number },
  average_energy_level: { type: Number },
}, { _id: false });

// Schema for the timestamps object
const timestampsSchema = new mongoose.Schema({
  last_updated: { type: Date },
  created_at: { type: Date },
}, { _id: false });

// Main Schema representing the full JSON document
const dailyLogSchema = new mongoose.Schema({
  log_id: { type: String },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  daily_logs: [logEntrySchema],
  daily_log_summary: summarySchema,
  timestamps_info: timestampsSchema, // renaming slightly to avoid conflict with mongoose timestamps
}, {
  timestamps: true,
});

const DailyLog = mongoose.model('DailyLog', dailyLogSchema);
module.exports = DailyLog;

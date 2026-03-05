'use strict';

require('dotenv').config({ path: `${__dirname}/../.env` });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const {
  User, Doctor, Session, LactationLog,
  DailyLog, PeriodLog, Community, Ngo, Medicine, InsurancePlan,
} = require('../models');

const read = (file) => {
  const p = path.join(__dirname, file);
  if (!fs.existsSync(p)) { console.log(`  ⚠️  Skipping (not found): ${file}`); return null; }
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { console.error(`  ❌ Parse error in ${file}: ${e.message}`); return null; }
};

// ── Seed User ────────────────────────────────────────────────
const seedUser = async () => {
  const data = read('user.json');
  if (!data) return null;
  await User.deleteMany({});
  const password_hash = await bcrypt.hash(data.password || 'Password@123', 12);
  const { password, ...userData } = data;
  const user = await User.create({ ...userData, password_hash });
  console.log(`  ✅ Users          — 1 inserted (${user.email})`);
  return user;
};

// ── Seed Doctors ─────────────────────────────────────────────
const seedDoctors = async () => {
  const data = read('doctor.json');
  if (!data) return [];
  await Doctor.deleteMany({});
  const doctors = await Doctor.insertMany(data);
  console.log(`  ✅ Doctors        — ${doctors.length} inserted`);
  return doctors;
};

// ── Seed Sessions ────────────────────────────────────────────
const seedSessions = async (user, doctors) => {
  const data = read('sessions.json');
  if (!data || !user || !doctors.length) return;
  await Session.deleteMany({});
  const mapped = data.map((s, i) => ({
    ...s,
    user_id: user._id,
    doctor_id: doctors[i % doctors.length]._id,
    session_date: new Date(s.session_date),
  }));
  const sessions = await Session.insertMany(mapped);
  console.log(`  ✅ Sessions       — ${sessions.length} inserted`);
};

// ── Seed Lactation Logs ──────────────────────────────────────
const seedLactation = async (user) => {
  const data = read('lactation.json');
  if (!data || !user) return;
  await LactationLog.deleteMany({});
  const mapped = data.map(l => ({ ...l, user_id: user._id, timestamp: new Date(l.timestamp) }));
  const logs = await LactationLog.insertMany(mapped);
  console.log(`  ✅ Lactation Logs — ${logs.length} inserted`);
};

// ── Seed Daily Logs ──────────────────────────────────────────
const seedDailyLogs = async (user) => {
  const data = read('dailylog.json');
  if (!data || !user) return;
  await DailyLog.deleteMany({});
  const mapped = data.map(d => {
    const date = new Date(d.date);
    date.setUTCHours(0, 0, 0, 0);
    return { ...d, user_id: user._id, date };
  });
  const logs = await DailyLog.insertMany(mapped);
  console.log(`  ✅ Daily Logs     — ${logs.length} inserted`);
};

// ── Seed Period Logs ─────────────────────────────────────────
const seedPeriodLogs = async (user) => {
  const data = read('period.json');
  if (!data || !user) return;
  await PeriodLog.deleteMany({});
  const mapped = data.map(p => ({
    ...p,
    user_id: user._id,
    cycle_start: new Date(p.cycle_start),
    cycle_end: p.cycle_end ? new Date(p.cycle_end) : undefined,
    next_period_predicted: p.next_period_predicted ? new Date(p.next_period_predicted) : undefined,
    ovulation_predicted: p.ovulation_predicted ? new Date(p.ovulation_predicted) : undefined,
    fertility_window_start: p.fertility_window_start ? new Date(p.fertility_window_start) : undefined,
    fertility_window_end: p.fertility_window_end ? new Date(p.fertility_window_end) : undefined,
  }));
  const logs = await PeriodLog.insertMany(mapped);
  console.log(`  ✅ Period Logs    — ${logs.length} inserted`);
};

// ── Seed Communities ─────────────────────────────────────────
const seedCommunities = async () => {
  const data = read('community.json');
  if (!data) return;
  await Community.deleteMany({});
  const list = await Community.insertMany(data);
  console.log(`  ✅ Communities    — ${list.length} inserted`);
};

// ── Seed NGOs ────────────────────────────────────────────────
const seedNgos = async () => {
  const data = read('ngo.json');
  if (!data) return;
  await Ngo.deleteMany({});
  const list = await Ngo.insertMany(data);
  console.log(`  ✅ NGOs           — ${list.length} inserted`);
};

// ── Seed Medicines ───────────────────────────────────────────
const seedMedicines = async () => {
  const data = read('medicine.json');
  if (!data) return;
  const meds = Array.isArray(data) ? data : (data.current_medications || []);
  await Medicine.deleteMany({});
  const mapped = meds.map(m => ({
    name: m.name || m.medication_id || 'Unknown',
    category: m.category || 'General',
    dose: m.dose || 'Standard',
    frequency: m.frequency || 'Once daily',
    instructions: m.instructions,
    duration: m.duration,
    purpose: m.purpose,
  }));
  const list = await Medicine.insertMany(mapped);
  console.log(`  ✅ Medicines      — ${list.length} inserted`);
};

// ── Seed Insurance ───────────────────────────────────────────
const seedInsurance = async () => {
  const data = read('insurance.json');
  if (!data) return;
  const plans = Array.isArray(data) ? data : [data];
  await InsurancePlan.deleteMany({});
  const mapped = plans.map(p => ({
    scheme_name: p.scheme_name || p.bank_name || 'Unknown Scheme',
    bank_name: p.bank_name,
    description: p.description || p.eligibility_criteria,
    eligibility: p.eligibility || p.eligibility_criteria,
    coverage: p.coverage,
  }));
  const list = await InsurancePlan.insertMany(mapped);
  console.log(`  ✅ Insurance Plans — ${list.length} inserted`);
};

// ── Main ────────────────────────────────────────────────────
const run = async () => {
  try {
    console.log('\n  🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`  ✅ Connected: ${mongoose.connection.host} / ${mongoose.connection.name}\n`);
    console.log('  📦 Importing seed data...\n');

    const user = await seedUser();
    const doctors = await seedDoctors();

    await seedSessions(user, doctors);
    await seedLactation(user);
    await seedDailyLogs(user);
    await seedPeriodLogs(user);
    await seedCommunities();
    await seedNgos();
    await seedMedicines();
    await seedInsurance();

    console.log('\n  🌸 All data imported into the `afterma` database!');
  } catch (err) {
    console.error('\n  ❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('  📴 Disconnected.\n');
    process.exit(0);
  }
};

run();

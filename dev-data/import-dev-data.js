'use strict';

require('dotenv').config({ path: `${__dirname}/../.env` });

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// ── Models ──────────────────────────────────────────────────────────────────
const User = require('../models/user.model');
const Doctor = require('../models/doctor.model');
const Ngo = require('../models/ngo.model');
const InsurancePlan = require('../models/insurancePlan.model');
const Medicine = require('../models/medicine.model');
const Community = require('../models/community.model');
const Session = require('../models/session.model');
const Period = require('../models/period.model');
const MedicalProfile = require('../models/medicalProfile.model');
const DailyLog = require('../models/dailyLog.model');
const HealthSummary = require('../models/healthSummary.model');

// ── Helpers ──────────────────────────────────────────────────────────────────
const readJSON = (filename) => {
  const filePath = path.join(__dirname, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  File not found, skipping: ${filename}`);
    return null;
  }
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    if (!fileContent.trim()) return null; // empty file
    return JSON.parse(fileContent);
  } catch (err) {
    console.error(`  ❌ Failed to parse ${filename}: ${err.message}`);
    return null;
  }
};

let dummyUser = null;

// ── Shared User Setup ──────────────────────────────────────────────────────
const getOrCreateDummyUser = async () => {
  if (dummyUser) return dummyUser;

  const data = readJSON('user.json');
  const p = data && data.person_profile ? data.person_profile : {};

  const email = (p.contact && p.contact.email && !p.contact.email.includes('[EMAIL'))
    ? p.contact.email
    : 'aditi.sharma@example.com';

  let user = await User.findOne({ email });
  if (!user) {
    const hashedPassword = await bcrypt.hash('Password@123', 12);
    user = await User.create({
      full_name: p.full_name || 'Aditi Sharma',
      email: email,
      password_hash: p.password_hash || hashedPassword,
      phone: (p.contact && p.contact.phone) ? p.contact.phone : '+919999999999',

      // Personal fields
      person_id: p.person_id,
      Dob: p.Dob ? new Date(p.Dob) : undefined,
      blood_group: p.blood_group,
      cycle_length_days: parseInt(p.cycle_length_days) || 28,
      delivery_type: p.delivery_type,
      phase: p.phase,
      profile_picture_url: p.profile_picture_url,

      // KYC & Address
      aadhar_number: p.aadhar_number,
      address: p.address,
      city: p.city,
      pincode: p.pincode,
      state: p.state,
      country: p.country,

      // Vitals & Lab Measurements
      weight_kg: parseFloat(p.weight_kg) || undefined,
      height_cm: parseFloat(p.height_cm) || undefined,
      bmi: parseFloat(p.bmi) || undefined,
      haemoglobin_level: parseFloat(p.haemoglobin_level) || undefined,
      thyroid_level: parseFloat(p.thyroid_level) || undefined,
      vitamin_d3_level: parseFloat(p.vitamin_d3_level) || undefined,
      glucose_level: parseFloat(p.glucose_level) || undefined,
      ferritin_level: parseFloat(p.ferritin_level) || undefined,
      serum_ferritin_level: parseFloat(p.serum_ferritin_level) || undefined,
      symboms: p.symboms || [],

      // Relation & Reference IDs
      summary_id: p.summary_id,
      period_id: p.period_id,
      log_id: p.log_id,
      session_id: p.session_id,
      booking_id: p.booking_id,
      insurance_id: p['insurance_id '], // note space in json
      care_circle_id: data.care_circle_id,
      doctor_id: data.doctor_id,

      // Nested objects
      contact: p.contact,
      family: p.family,
      privacy_mode: p.privacy_mode,
      preferences: p.preferences,
      appointments: data.appointments,
      resource_library: data.resource_library,

      // Status & Subscriptions
      subscription: p.subscription,
      is_active: true,
      role: 'user',
    });
  }
  dummyUser = user;
  return dummyUser;
};

// ── Import Functions ─────────────────────────────────────────────────────────

const importDoctors = async () => {
  const data = readJSON('doctor.json');
  if (!data) return;

  const doctors = Array.isArray(data) ? data : (data.doctors || []);

  const mapped = doctors.map(d => ({
    name: d.name,
    email: d.email && !d.email.includes('[EMAIL') ? d.email : undefined,
    phone: d.phone && !d.phone.includes('[phone') ? d.phone : undefined,
    specialization: d.specialization,
    expertise_area: d.sub_specialty,
    type: d.designation,
    hospital: d.Facility_name,
    address: d.Facility_address,
    location: d.location,
    city: d.location,
    experience_years: d.experience_years,
    session_fee: d.session_fee,
    rating: d.rating,
    total_reviews: d.review_count || 0,
    active: d.active !== false,
    verified: true,
    registration_number: d.doctor_proof,
    qualifications: d.credentials ? [d.credentials] : [],
  }));

  await Doctor.deleteMany({});
  const inserted = await Doctor.insertMany(mapped);
  console.log(`  ✅ Doctors         — ${inserted.length} records inserted`);
  return inserted;
};

const importNgos = async () => {
  const data = readJSON('ngo.json');
  if (!data) return;

  const ngos = Array.isArray(data) ? data : [];
  const mapped = ngos.map(n => ({
    title: n.title,
    description: n.description,
    awareness_info: n.awareness_info,
    category: n.category,
    location: n.location,
    address: n.address,
    support_number: n.support_number,
    email: n.email,
    website: n.website,
    operating_hours: n.operating_hours,
    emergency_support: n.emergency_support || false,
    active_support: n.active_support !== false,
    rating: n.rating,
    beneficiaries_served: n.beneficiaries_served,
  }));

  await Ngo.deleteMany({});
  await Ngo.insertMany(mapped);
  console.log(`  ✅ NGOs            — ${mapped.length} records inserted`);
};

const importInsurance = async () => {
  const insData = readJSON('insurance.json');
  const bankData = readJSON('bank.json');

  let plans = [];
  if (insData) plans = plans.concat(Array.isArray(insData) ? insData : [insData]);
  if (bankData) plans = plans.concat(Array.isArray(bankData) ? bankData : [bankData]);

  if (plans.length === 0) return;

  const mapped = plans.map(p => ({
    scheme_name: p.scheme_name,
    bank_name: p.bank_name,
    description: p.description || p.eligibility_criteria,
    eligibility: p.eligibility || p.eligibility_criteria,
    coverage: p.coverage,
    metrics: p.metrics,
    active: p.status?.active !== false && p.active !== false,
    analytics: p.analytics,
  }));

  await InsurancePlan.deleteMany({});
  await InsurancePlan.insertMany(mapped);
  console.log(`  ✅ Insurance Plans — ${mapped.length} records inserted (merged insurance & bank.json)`);
};

const importMedicines = async () => {
  const data = readJSON('medicine.json');
  if (!data) return;

  const meds = Array.isArray(data) ? data : (data.current_medications || []);
  const mapped = meds.map(m => ({
    category: m.category || 'General',
    name: m.name || m.medication_id || 'Unknown Medicine',
    dose: m.dose || 'Standard',
    frequency: m.frequency || 'Once daily',
    instructions: m.instructions,
    duration: m.duration,
    purpose: m.purpose,
    is_active: true,
  }));

  await Medicine.deleteMany({});
  await Medicine.insertMany(mapped);
  console.log(`  ✅ Medicines       — ${mapped.length} records inserted`);
};

const importCommunities = async () => {
  const data = readJSON('community.json');
  if (!data) return;

  const communities = Array.isArray(data) ? data : (data.communities || []);
  if (communities.length === 0) return;

  await Community.deleteMany({});
  await Community.insertMany(communities);
  console.log(`  ✅ Communities     — ${communities.length} records inserted`);
};

const importSessions = async (doctors) => {
  const data = readJSON('sessions.json');
  if (!data || !doctors || doctors.length === 0) return;

  const sessions = Array.isArray(data) ? data : [];
  const user = await getOrCreateDummyUser();

  // Pick first doctor for mapping
  const doctorId = doctors[0]._id;

  const mapped = sessions.map(s => ({
    user_id: user._id,
    doctor_id: doctorId,
    session_date: s.session_date,
    session_time: s.session_time,
    session_type: s.session_type,
    session_status: s.session_status,
    session_fee: parseInt(s.session_fee, 10) || 0,
    session_currency: s.session_currency,
    meeting_link: s.meeting_link || 'https://meet.google.com/xyz',
  }));

  await Session.deleteMany({});
  await Session.insertMany(mapped);
  console.log(`  ✅ Sessions        — ${mapped.length} records inserted`);
};

const importPeriod = async () => {
  const data = readJSON('period.json');
  if (!data) return;

  const user = await getOrCreateDummyUser();

  const mapped = {
    user_id: user._id,
    cycle_settings: data.cycle_settings,
    period_cycles: data.period_cycles || [],
    predictions: data.predictions,
    analytics_summary: data.analytics_summary,
  };

  await Period.deleteMany({});
  await Period.create(mapped);
  console.log(`  ✅ Period tracking — 1 record inserted`);
};

const importMedicalProfile = async () => {
  const data = readJSON('user.json');
  if (!data || !data.person_profile) return;

  const p = data.person_profile;
  const user = await getOrCreateDummyUser();

  let heightCm = parseFloat(p.height_cm);
  let weightKg = parseFloat(p.weight_kg);
  let bmi = null;
  if (heightCm && weightKg) {
    bmi = parseFloat((weightKg / Math.pow(heightCm / 100, 2)).toFixed(1));
  }

  const mapped = {
    user_id: user._id,
    blood_group: p.blood_group,
    aadhar_number: p.aadhar_number,
    address: p.address,
    city: p.city,
    state: p.state,
    pincode: p.pincode,
    country: p.country,
    weight_kg: weightKg,
    height_cm: heightCm,
    bmi: bmi || p.bmi,

    haemoglobin_level: parseFloat(p.haemoglobin_level) || 0,
    thyroid_level: parseFloat(p.thyroid_level) || 0,
    vitamin_d3_level: parseFloat(p.vitamin_d3_level) || 0,
    glucose_level: parseFloat(p.glucose_level) || 0,
    ferritin_level: parseFloat(p.ferritin_level) || 0,
    serum_ferritin_level: parseFloat(p.serum_ferritin_level) || 0,

    symptoms: p.symboms || [],
    family: p.family
  };

  await MedicalProfile.deleteMany({});
  await MedicalProfile.create(mapped);
  console.log(`  ✅ Medical Profile — 1 record inserted`);
};

const importDailyLogs = async () => {
  const data = readJSON('dailylog.json');
  if (!data || !data.daily_logs) return;

  const user = await getOrCreateDummyUser();

  const mapped = {
    log_id: data.log_id,
    user_id: user._id,
    daily_logs: data.daily_logs || [],
    daily_log_summary: data.daily_log_summary || {},
    timestamps_info: data.timestamps || {},
  };

  await DailyLog.deleteMany({});
  await DailyLog.create(mapped);
  console.log(`  ✅ Daily Logs      — 1 document inserted with ${data.daily_logs.length} logs`);
};

const importHealthSummary = async () => {
  const data = readJSON('healthSummary.json');
  if (!data) return;

  const user = await getOrCreateDummyUser();

  const v = data.clinical_vitals || {};
  const r = data.readiness_indices || {};
  const hs = data.overall_health_score || {};
  const w = data.wellness_scores || {};

  const mapped = {
    user_id: user._id,
    summary_date: data.generated_at || new Date(),
    hydration_ratio: v.hydration_ratio_percent || 50,
    sleep_quality: v.sleep_quality_percent || 75,
    pelvic_index: v.pelvic_index || 0,
    activity_load: v.activity_load_score || 1,

    tissue_restoration: r.tissue_restoration_percent || 50,
    pelvic_resilience: r.pelvic_resilience_percent || 50,
    core_alignment: r.core_alignment_percent || 50,

    afterma_readiness_score: hs.afterma_readiness_score || 80,
    risk_level: hs.risk_level === 'Moderate' ? 'Moderate Risk' : 'Optimal',

    pain_intensity: w.pain_intensity_score || 0,
    cramps_severity: data.symptom_analysis?.cramps_severity_score || 0,

    associated_symptoms: data.current_conditions || [],
    alerts: data.ai_recommendations || [],
  };

  await HealthSummary.deleteMany({});
  await HealthSummary.create(mapped);
  console.log(`  ✅ Health Summary  — 1 record inserted`);
};

// ── Delete All ───────────────────────────────────────────────────────────────
const deleteAll = async () => {
  await Doctor.deleteMany({});
  await Ngo.deleteMany({});
  await InsurancePlan.deleteMany({});
  await Medicine.deleteMany({});
  await Community.deleteMany({});
  await Session.deleteMany({});
  await Period.deleteMany({});
  await MedicalProfile.deleteMany({});
  await DailyLog.deleteMany({});
  await HealthSummary.deleteMany({});
  // We optionally leave users so we don't nuke actual users, 
  // unless we strictly want to wipe everything.
  console.log('  🗑️  All seeded collections cleared.');
};

// ── Main ────────────────────────────────────────────────────────────────────
const run = async () => {
  const args = process.argv.slice(2);
  // Auto default to importing everything if no flags are provided
  const doDelete = true;
  const doImport = true;

  try {
    console.log('\n  🔌 Connecting to MongoDB (afterma)...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`  ✅ Connected: ${mongoose.connection.host} / ${mongoose.connection.name}\n`);

    if (doDelete) {
      console.log('  🗑️  Deleting old data...');
      await deleteAll();
      console.log('');
    }

    if (doImport) {
      console.log('  📦 Importing all JSON data files...\n');
      const doctors = await importDoctors();
      await importNgos();
      await importInsurance();
      await importMedicines();
      await importCommunities();
      await importSessions(doctors);
      await importPeriod();
      try { await importMedicalProfile(); } catch (e) { console.log('MedicalProfile error:', e.message); }
      try { await importDailyLogs(); } catch (e) { console.log('DailyLog error:', e.message); }
      try { await importHealthSummary(); } catch (e) { console.log('HealthSummary error:', e.message); }
      console.log('\n  🌸 All data imported successfully into the `afterma` database!');
    }

  } catch (err) {
    console.error('\n  ❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('  📴 Disconnected from MongoDB.\n');
    process.exit(0);
  }
};

run();

'use strict';

/**
 * AFTERMA — Master Seed Script
 * Database: afterma  (enforced by MONGO_URI in .env)
 *
 * Seeded collections:
 *   users, doctors, sessions, period_logs (via Period model),
 *   daily_logs, health_summaries, insurance_schemes, appointments, communities, ngos
 *
 * Usage: node scripts/seed.js
 */

require('dotenv').config();

const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const bcrypt = require('bcryptjs');
const {
  User, Doctor, Community, Ngo, InsurancePlan,
  Session, Period, DailyLog, HealthSummary, Appointment, Medicine,
} = require('../models');
const { calculateHealthSummary } = require('../services/healthScoring.service');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const daysAgo = (n) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const seed = async () => {
  await connectDB();
  console.log('\n🌱 Seeding AFTERMA database...\n');

  const pw = await bcrypt.hash('Afterma@123', 12);

  /* ══════════════════════════════════════════════
   *  1. USERS
   * ══════════════════════════════════════════════ */
  const adminUser = await User.findOneAndUpdate(
    { email: 'admin@afterma.health' },
    {
      $set: {
        full_name: 'AFTERMA Admin',
        email: 'admin@afterma.health',
        password_hash: pw,
        role: 'admin',
        is_verified: true,
        is_active: true,
      }
    },
    { upsert: true, returnDocument: 'after' }
  );

  const aditi = await User.findOneAndUpdate(
    { email: 'aditi@example.com' },
    {
      $set: {
        full_name: 'Aditi Sharma',
        Dob: new Date('1997-04-15'),
        email: 'aditi@example.com',
        password_hash: pw,
        maternity_stage: 'Postpartum',
        delivery_type: 'C-section',
        delivery_date: new Date('2025-11-01'),
        weight_kg: 62,
        height_cm: 165,
        last_period_date: new Date('2026-01-10'),
        cycle_length_days: 28,
        period_duration_days: 5,
        flow_intensity: 'medium',
        caregiver_name: 'Rohit Sharma',
        caregiver_relationship: 'Husband',
        caregiver_phone: '+91-9123456789',
        medical_history: ['Thyroid imbalance'],
        allergies: ['Penicillin'],
        current_medications: ['Iron supplements'],
        is_verified: true,
        is_active: true,
      }
    },
    { upsert: true, returnDocument: 'after' }
  );

  const priyaUser = await User.findOneAndUpdate(
    { email: 'priyanka@example.com' },
    {
      $set: {
        full_name: 'Priyanka Reddy',
        email: 'priyanka@example.com',
        password_hash: pw,
        maternity_stage: 'Postpartum',
        delivery_type: 'Normal',
        delivery_date: new Date('2026-01-15'),
        weight_kg: 58,
        height_cm: 162,
        cycle_length_days: 30,
        is_verified: true,
        is_active: true,
      }
    },
    { upsert: true, returnDocument: 'after' }
  );

  console.log(`✅ Users seeded: ${adminUser.email}, ${aditi.email}, ${priyaUser.email}`);

  /* ══════════════════════════════════════════════
   *  2. DOCTORS  (→ afterma.doctors)
   * ══════════════════════════════════════════════ */
  const doctorData = [
    {
      name: 'Dr. Priya Sharma',
      email: 'dr.priya@afterma.health',
      specialization: 'OB-GYN',
      designation: 'Consultant Gynecologist',
      expertise_area: 'Postpartum Core Recovery',
      type: 'OB-GYN',
      experience_years: 12,
      location: 'Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      address: 'Apollo Hospital, Bandra West',
      hospital: 'Apollo Hospital',
      facility_name: 'Apollo Hospital, Mumbai',
      session_fee: 800,
      rating: 4.7,
      consultation_modes: ['Video', 'In-person'],
      languages: ['English', 'Hindi', 'Marathi'],
      active: true,
      verified: true,
      available_for_booking: true,
    },
    {
      name: 'Dr. Ritu Mehta',
      email: 'dr.ritu@afterma.health',
      specialization: 'Physiotherapy',
      designation: 'Senior Physiotherapist',
      expertise_area: 'Pelvic Floor Rehabilitation',
      type: 'Physiotherapy',
      experience_years: 8,
      location: 'Delhi',
      city: 'Delhi',
      state: 'Delhi',
      address: 'Max Healthcare, Saket',
      hospital: 'Max Healthcare',
      facility_name: 'Max Healthcare, Saket',
      session_fee: 600,
      rating: 4.5,
      consultation_modes: ['Video', 'In-person'],
      languages: ['English', 'Hindi'],
      active: true,
      verified: true,
      available_for_booking: true,
    },
    {
      name: 'Dr. Ananya Roy',
      email: 'dr.ananya@afterma.health',
      specialization: 'Lactation',
      designation: 'Certified Lactation Consultant',
      expertise_area: 'Postpartum Depression & Breastfeeding',
      type: 'Lactation',
      experience_years: 10,
      location: 'Bangalore',
      city: 'Bangalore',
      state: 'Karnataka',
      facility_name: 'Motherhood Clinic, Indiranagar',
      session_fee: 500,
      rating: 4.9,
      consultation_modes: ['Video', 'Chat'],
      languages: ['English', 'Hindi', 'Bengali'],
      active: true,
      verified: true,
      available_for_booking: true,
    },
    {
      name: 'Dr. Kavita Nair',
      email: 'dr.kavita@afterma.health',
      specialization: 'OB-GYN',
      designation: 'Senior Gynecologist',
      expertise_area: 'High-Risk Pregnancy & Recovery',
      type: 'OB-GYN',
      experience_years: 15,
      location: 'Chennai',
      city: 'Chennai',
      state: 'Tamil Nadu',
      facility_name: 'MIOT International, Chennai',
      session_fee: 1000,
      rating: 4.8,
      consultation_modes: ['Video', 'In-person'],
      languages: ['English', 'Tamil'],
      active: true,
      verified: true,
      available_for_booking: true,
    },
  ];

  const doctors = [];
  for (const d of doctorData) {
    const doc = await Doctor.findOneAndUpdate(
      { email: d.email },
      { $set: d },
      { upsert: true, returnDocument: 'after' }
    );
    doctors.push(doc);
  }
  console.log(`✅ Doctors seeded: ${doctors.length} records`);

  /* ══════════════════════════════════════════════
   *  3. SESSIONS  (→ afterma.sessions)
   * ══════════════════════════════════════════════ */
  const existingSession = await Session.findOne({ user_id: aditi._id, doctor_id: doctors[0]._id });
  let session1;
  if (!existingSession) {
    session1 = await Session.create({
      user_id: aditi._id,
      doctor_id: doctors[0]._id,
      session_date: daysAgo(-3), // 3 days ahead
      session_time: '11:00',
      session_type: 'video',
      session_fee: doctors[0].session_fee,
      session_status: 'upcoming',
      meeting_link: 'https://meet.afterma.health/room/seed-001',
    });
  } else {
    session1 = existingSession;
  }

  const existingSession2 = await Session.findOne({ user_id: priyaUser._id, doctor_id: doctors[1]._id });
  if (!existingSession2) {
    await Session.create({
      user_id: priyaUser._id,
      doctor_id: doctors[1]._id,
      session_date: daysAgo(7),
      session_time: '10:00',
      session_type: 'in-person',
      session_fee: doctors[1].session_fee,
      session_status: 'completed',
      session_notes: 'Good progress on pelvic floor exercises.',
    });
  }
  console.log('✅ Sessions seeded (2 records)');

  /* ══════════════════════════════════════════════
   *  4. APPOINTMENTS  (→ afterma.appointments)
   * ══════════════════════════════════════════════ */
  const existingAppt = await Appointment.findOne({ user_id: aditi._id, doctor_id: doctors[0]._id });
  if (!existingAppt) {
    await Appointment.create({
      user_id: aditi._id,
      doctor_id: doctors[0]._id,
      session_id: session1._id,
      appointment_date: daysAgo(-3),
      appointment_time: '11:00',
      appointment_type: 'video',
      fee: doctors[0].session_fee,
      status: 'upcoming',
      reason_for_visit: 'Postpartum check-up',
      meeting_link: 'https://meet.afterma.health/room/seed-001',
    });
  }
  console.log('✅ Appointments seeded');

  /* ══════════════════════════════════════════════
   *  5. PERIOD LOGS  (→ afterma.periods)
   * ══════════════════════════════════════════════ */
  const existingPeriod = await Period.findOne({ user_id: aditi._id });
  if (!existingPeriod) {
    await Period.create({
      user_id: aditi._id,
      cycle_settings: {
        average_cycle_length_days: 28,
        average_period_length_days: 5,
        cycle_variance_days: 2,
      },
      period_cycles: [
        {
          period_start_date: new Date('2026-01-10'),
          period_end_date: new Date('2026-01-15'),
          cycle_length_days: 28,
          flow_pattern: 'medium',
          symptoms_reported: ['Cramps', 'Bloating'],
          notes: 'Regular cycle.',
        },
        {
          period_start_date: new Date('2026-02-07'),
          period_end_date: new Date('2026-02-12'),
          cycle_length_days: 28,
          flow_pattern: 'light',
          symptoms_reported: ['Mild cramps'],
        },
      ],
      predictions: {
        next_expected_period: new Date('2026-03-07'),
        fertility_window: {
          start_date: new Date('2026-02-21'),
          end_date: new Date('2026-02-26'),
        },
        predicted_ovulation_day: new Date('2026-02-23'),
      },
      analytics_summary: {
        average_cycle_length: 28,
        average_period_duration: 5,
        average_pain_level: 3,
        cycle_regularity: 'Regular',
      },
    });
  }
  console.log('✅ Period logs seeded');

  /* ══════════════════════════════════════════════
   *  6. DAILY LOGS + HEALTH SUMMARIES  (→ afterma.daily_logs / health_summaries)
   * ══════════════════════════════════════════════ */
  const logDays = [
    { daysBack: 2, sleep: 7.5, water: 2.5, pain: 2, mood: 8, energy: 7, steps: 4500, workout: 20 },
    { daysBack: 1, sleep: 6.0, water: 1.8, pain: 3, mood: 6, energy: 5, steps: 3000, workout: 0 },
    { daysBack: 0, sleep: 8.0, water: 3.0, pain: 1, mood: 9, energy: 8, steps: 5500, workout: 30 },
  ];

  for (const entry of logDays) {
    const logDate = daysAgo(entry.daysBack);
    const exists = await DailyLog.findOne({ user_id: aditi._id, log_date: logDate });
    if (!exists) {
      const log = await DailyLog.create({
        user_id: aditi._id,
        log_date: logDate,
        sleep_hours: entry.sleep,
        water_liters: entry.water,
        pain_intensity: entry.pain,
        mood_score: entry.mood,
        energy_level: entry.energy,
        daily_steps: entry.steps,
        workout_minutes: entry.workout,
        symptoms: entry.pain > 2 ? ['Back pain', 'Mild cramps'] : [],
      });

      const summaryData = calculateHealthSummary(log, aditi);
      const summaryExists = await HealthSummary.findOne({ log_id: log._id });
      if (!summaryExists) {
        await HealthSummary.create({
          user_id: aditi._id,
          log_id: log._id,
          summary_date: logDate,
          hydration_ratio: summaryData.hydration_ratio,
          sleep_quality: summaryData.sleep_quality,
          pelvic_index: summaryData.pelvic_index,
          activity_load: summaryData.activity_load,
          tissue_restoration: summaryData.tissue_restoration,
          pelvic_resilience: summaryData.pelvic_resilience,
          core_alignment: summaryData.core_alignment,
          afterma_readiness_score: summaryData.afterma_readiness_score,
          risk_level: summaryData.risk_level,
          pain_intensity: summaryData.pain_intensity || 0,
          cramps_severity: summaryData.cramps_severity || 0,
          pelvic_pressure: summaryData.pelvic_pressure || false,
          hydration_adherence: summaryData.hydration_adherence || 0,
          rest_efficiency: summaryData.rest_efficiency || 0,
          alerts: summaryData.alerts || [],
          ai_flags: summaryData.ai_flags || {},
        });
      }
    }
  }
  console.log('✅ Daily logs + health summaries seeded (3 records)');

  /* ══════════════════════════════════════════════
   *  7. COMMUNITIES  (→ afterma.communities)
   * ══════════════════════════════════════════════ */
  const communityData = [
    {
      title: 'Postpartum Recovery Circle',
      short_description: 'Support group for mothers recovering after childbirth',
      category: 'Postpartum',
      tags: ['postpartum', 'recovery', 'support'],
      active: true,
      created_by: adminUser._id,
    },
    {
      title: 'Period Health Hub',
      short_description: 'Track, learn, and share about menstrual health',
      category: 'Period Health',
      tags: ['period', 'cycle', 'menstrual'],
      active: true,
      created_by: adminUser._id,
    },
    {
      title: 'Mind & Motherhood',
      short_description: 'Mental wellness for new and expecting mothers',
      category: 'Mental Wellness',
      tags: ['mental-health', 'anxiety', 'postpartum-depression'],
      active: true,
      created_by: adminUser._id,
    },
    {
      title: 'Breastfeeding Moms',
      short_description: 'Community support for breastfeeding questions and challenges',
      category: 'Lactation',
      tags: ['breastfeeding', 'lactation', 'newborn'],
      active: true,
      created_by: adminUser._id,
    },
  ];

  for (const c of communityData) {
    await Community.findOneAndUpdate({ title: c.title }, { $set: c }, { upsert: true });
  }
  console.log(`✅ Communities seeded: ${communityData.length} records`);

  /* ══════════════════════════════════════════════
   *  8. NGOs  (→ afterma.ngos)
   * ══════════════════════════════════════════════ */
  const ngoData = [
    {
      title: 'Women Care NGO',
      awareness_info: 'Maternal health awareness across India',
      location: 'Delhi',
      city: 'Delhi',
      country: 'India',
      support_number: '9876543210',
      focus_areas: ['Maternal Health', 'Nutrition', 'Mental Wellness'],
      active_support: true,
      verified: true,
    },
    {
      title: 'Amma Foundation',
      awareness_info: 'Supporting rural mothers through postpartum care',
      location: 'Chennai',
      city: 'Chennai',
      country: 'India',
      support_number: '9123456781',
      focus_areas: ['Postpartum Care', 'Breastfeeding Support'],
      active_support: true,
      verified: true,
    },
    {
      title: 'Shakti Mahila Sangh',
      awareness_info: 'Empowering women in semi-urban India',
      location: 'Pune',
      city: 'Pune',
      country: 'India',
      support_number: '9234567890',
      focus_areas: ['Women Empowerment', 'Maternal Health', 'Child Nutrition'],
      active_support: true,
      verified: true,
    },
  ];

  for (const n of ngoData) {
    await Ngo.findOneAndUpdate({ title: n.title }, { $set: n }, { upsert: true });
  }
  console.log(`✅ NGOs seeded: ${ngoData.length} records`);

  /* ══════════════════════════════════════════════
   *  9. INSURANCE PLANS  (→ afterma.insuranceplans)
   * ══════════════════════════════════════════════ */
  const insuranceData = [
    {
      bank_name: 'SBI',
      scheme_name: 'Janani Raksha Health Cover',
      description: 'Full hospitalization, mental health support, and in-home nursing.',
      approval_rate: 88,
      processing_days: 5,
      clients_served: 12000,
      coverage_min: 500000,
      coverage_max: 1000000,
      coverage_areas: ['Full Hospitalization', 'Mental Health Support', 'In-Home Nursing'],
      required_age: 18,
      active: true,
    },
    {
      bank_name: 'HDFC Bank',
      scheme_name: 'Maternity Extension Plan',
      description: 'Cashless recovery assist, expert consultations, and medication coverage.',
      approval_rate: 92,
      processing_days: 3,
      clients_served: 18000,
      coverage_min: 300000,
      coverage_max: 1500000,
      coverage_areas: ['Cashless Recovery', 'Expert Consultations', 'Medication Coverage'],
      required_age: 21,
      active: true,
    },
    {
      bank_name: 'ICICI Bank',
      scheme_name: 'New Mother Essential',
      description: 'Postpartum physio inclusion, safe shield, and lactation specialist access.',
      approval_rate: 78,
      processing_days: 4,
      clients_served: 8000,
      coverage_min: 200000,
      coverage_max: 800000,
      coverage_areas: ['Postpartum Physio', 'Safe Shield Protection', 'Lactation Specialist'],
      required_age: 18,
      active: true,
    },
    {
      bank_name: 'Axis Bank',
      scheme_name: 'AfterMa Wellness Plan',
      description: 'Priority triage assist, holistic wellness rider, emergency red flag cover.',
      approval_rate: 85,
      processing_days: 6,
      clients_served: 10000,
      coverage_min: 500000,
      coverage_max: 2000000,
      coverage_areas: ['Priority Triage', 'Holistic Wellness Rider', 'Emergency Cover'],
      required_age: 25,
      active: true,
    },
  ];

  for (const ins of insuranceData) {
    await InsurancePlan.findOneAndUpdate(
      { bank_name: ins.bank_name, scheme_name: ins.scheme_name },
      { $set: ins },
      { upsert: true }
    );
  }
  console.log(`✅ Insurance plans seeded: ${insuranceData.length} records`);

  /* ══════════════════════════════════════════════
   *  DONE
   * ══════════════════════════════════════════════ */
  console.log('\n🎉 AFTERMA database seeded successfully!\n');
  console.log('   📋 Summary of seeded data:');
  console.log('      Users          : admin, aditi, priyanka');
  console.log('      Doctors        : 4 (OB-GYN ×2, Physio ×1, Lactation ×1)');
  console.log('      Sessions       : 2 (1 upcoming, 1 completed)');
  console.log('      Appointments   : 1');
  console.log('      Daily Logs     : 3 days for aditi');
  console.log('      Health Summary : 3 auto-calculated records');
  console.log('      Period Logs    : 2 cycles for aditi');
  console.log('      Communities    : 4');
  console.log('      NGOs           : 3');
  console.log('      Insurance Plans: 4');
  console.log('\n   🔐 Login credentials (all users):');
  console.log('      admin@afterma.health   /  Afterma@123');
  console.log('      aditi@example.com      /  Afterma@123');
  console.log('      priyanka@example.com   /  Afterma@123\n');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('\n❌ Seed failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});

'use strict';

require('dotenv').config();

const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const bcrypt = require('bcryptjs');
const {
  User, Doctor, Community, Ngo, InsurancePlan,
} = require('../models');

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding AFTERMA database...\n');

  // ── Users ──────────────────────────────────────────────────
  const pw = await bcrypt.hash('Afterma@123', 12);

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
        maternity_stage: 'Tracking',
      }
    },
    { upsert: true, new: true }
  );

  const aditi = await User.findOneAndUpdate(
    { email: 'aditi@example.com' },
    {
      $set: {
        full_name: 'Aditi Sharma',
        dob: '1997-04-15',
        email: 'aditi@example.com',
        password_hash: pw,
        maternity_stage: 'Postpartum',
        delivery_method: 'C-section',
        delivery_date: '2025-12-01',
        weight_kg: 62,
        height_cm: 165,
        last_period_date: '2026-01-10',
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
      }
    },
    { upsert: true, new: true }
  );

  console.log(`✅ Users: admin (${adminUser.email}), user (${aditi.email})`);

  // ── Doctors ────────────────────────────────────────────────
  const doctorData = [
    {
      name: 'Dr. Priya Sharma',
      email: 'priya@afterma.health',
      specialization: 'OB-GYN',
      expertise_area: 'Postpartum Core Recovery',
      type: 'Gynecology',
      experience_years: 12,
      location: 'Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      address: 'Apollo Hospital, Mumbai',
      hospital: 'Apollo Hospital',
      session_fee: 800,
      rating: 4.7,
      worked_on: 'Postpartum care, High-risk pregnancy',
      languages: ['English', 'Hindi', 'Marathi'],
      active: true,
      verified: true,
    },
    {
      name: 'Dr. Ritu Mehta',
      email: 'ritu@afterma.health',
      specialization: 'Physiotherapist',
      expertise_area: 'Pelvic Floor Rehabilitation',
      type: 'Physiotherapy',
      experience_years: 8,
      location: 'Delhi',
      city: 'Delhi',
      state: 'Delhi',
      session_fee: 600,
      rating: 4.5,
      worked_on: 'Pelvic rehabilitation, Core strengthening',
      languages: ['English', 'Hindi'],
      active: true,
      verified: true,
    },
    {
      name: 'Dr. Ananya Roy',
      email: 'ananya@afterma.health',
      specialization: 'Mental Wellness Coach',
      expertise_area: 'Postpartum Depression & Anxiety',
      type: 'Mental Wellness',
      experience_years: 10,
      location: 'Bangalore',
      city: 'Bangalore',
      state: 'Karnataka',
      session_fee: 500,
      rating: 4.9,
      consultation_modes: ['Video', 'Chat'],
      languages: ['English', 'Hindi', 'Bengali'],
      active: true,
      verified: true,
    },
  ];

  for (const d of doctorData) {
    await Doctor.findOneAndUpdate({ email: d.email }, { $set: d }, { upsert: true });
  }
  console.log('✅ Doctors seeded (3 records)');

  // ── Communities ────────────────────────────────────────────
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
  ];

  for (const c of communityData) {
    await Community.findOneAndUpdate({ title: c.title }, { $set: c }, { upsert: true });
  }
  console.log('✅ Communities seeded (3 records)');

  // ── NGOs ──────────────────────────────────────────────────
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
  ];

  for (const n of ngoData) {
    await Ngo.findOneAndUpdate({ title: n.title }, { $set: n }, { upsert: true });
  }
  console.log('✅ NGOs seeded (2 records)');

  // ── Insurance Plans ────────────────────────────────────────
  const insuranceData = [
    {
      bank_name: 'SBI',
      scheme_name: 'Health Secure',
      description: 'Covers maternity & surgery with comprehensive postpartum care',
      approval_rate: 92,
      processing_days: 7,
      clients_served: 5000,
      coverage_min: 50000,
      coverage_max: 500000,
      coverage_areas: ['Maternity', 'Surgery', 'Postpartum Care', 'Hospitalization'],
      required_age: 18,
      active: true,
    },
    {
      bank_name: 'HDFC Life',
      scheme_name: 'Maternity Plus',
      description: 'Premium maternity coverage with newborn care',
      approval_rate: 88,
      processing_days: 10,
      clients_served: 8000,
      coverage_min: 100000,
      coverage_max: 1000000,
      coverage_areas: ['Maternity', 'Newborn Care', 'Hospitalization', 'Pre & Post Natal'],
      required_age: 21,
      active: true,
    },
    {
      bank_name: 'Star Health',
      scheme_name: 'Young Star',
      description: 'Affordable health cover for young mothers',
      approval_rate: 85,
      processing_days: 5,
      clients_served: 12000,
      coverage_min: 25000,
      coverage_max: 250000,
      coverage_areas: ['Maternity', 'Postpartum', 'Mental Health'],
      required_age: 18,
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
  console.log('✅ Insurance Plans seeded (3 records)');

  console.log('\n🎉 Seed complete! AFTERMA database is ready.');
  console.log('   Default credentials: admin@afterma.health / Afterma@123');
  console.log('   Test user: aditi@example.com / Afterma@123\n');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});

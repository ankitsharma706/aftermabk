'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/db');
const { Doctor } = require('../models');

const fixHashes = async () => {
  try {
    await connectDB();
    const doctors = await Doctor.find({}).select('+password_hash');

    console.log(`Checking ${doctors.length} doctors...`);
    let count = 0;

    for (const doc of doctors) {
      if (doc.password_hash && !doc.password_hash.startsWith('$2')) {
        console.log(`Fixing hash for ${doc.email} (current: ${doc.password_hash})`);
        doc.password_hash = await bcrypt.hash(doc.password_hash, 12);
        await doc.save();
        count++;
      }
    }

    console.log(`Fixed ${count} doctors.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

fixHashes();

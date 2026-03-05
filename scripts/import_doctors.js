'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const { connectDB } = require('../config/db');
const { Doctor } = require('../models');

const importDoctors = async () => {
  try {
    await connectDB();

    const rawDoctor = fs.readFileSync(path.join(__dirname, '../dev-data/doctor.json'), 'utf-8');
    const doctorsData = JSON.parse(rawDoctor);

    console.log(`Found ${doctorsData.length} doctors in JSON file.`);

    for (const docData of doctorsData) {
      if (docData.password) {
        docData.password_hash = await bcrypt.hash(docData.password, 12);
        delete docData.password;
      }

      // Upsert based on email
      await Doctor.findOneAndUpdate(
        { email: docData.email },
        { $set: docData },
        { upsert: true, returnDocument: 'after' }
      );
      console.log(`Imported / Updated doctor: ${docData.name} (${docData.email})`);
    }

    console.log('✅ Doctor import complete.');
    process.exit();
  } catch (err) {
    console.error('❌ Import failed:', err);
    process.exit(1);
  }
};

importDoctors();

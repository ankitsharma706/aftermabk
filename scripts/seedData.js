const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const Doctor = require('../models/Doctor');
const Profile = require('../models/Profile');
const connectDB = require('../config/db');

dotenv.config({ path: path.join(__dirname, '../.env') });

const importData = async () => {
    try {
        await connectDB();

        const doctorsRef = await Doctor.find({});
        const profileRef = await Profile.find({});

        if (doctorsRef.length === 0) {
            const rawDoctor = fs.readFileSync(path.join(__dirname, '../doctor.json'), 'utf-8');
            const doctorsData = JSON.parse(rawDoctor).doctors;
            await Doctor.insertMany(doctorsData);
            console.log('Doctors Imported!');
        } else {
            console.log('Doctors already exist. Skipping.');
        }

        if (profileRef.length === 0) {
            const rawProfile = fs.readFileSync(path.join(__dirname, '../profile.json'), 'utf-8');
            const profileData = JSON.parse(rawProfile).person_profile;
            // The JSON structure for profile implies a flat structure in Mongoose, but the file has sections.
            // We map the JSON structure to our schema. 
            // The schema expects all these fields at root. The provided JSON has `person_profile` wrapping some fields, 
            // but `medical_profile`, `gentle_days_progress` are separate siblings in the root object.

            const fullJson = JSON.parse(rawProfile);

            const unifiedProfile = {
                ...fullJson.person_profile,
                medical_profile: fullJson.medical_profile,
                gentle_days_progress: fullJson.gentle_days_progress,
                care_circle: fullJson.care_circle,
                resource_library: fullJson.resource_library
            };

            await Profile.create(unifiedProfile);
            console.log('Profile Imported!');
        } else {
            console.log('Profile already exists. Skipping.');
        }

        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    // destroyData(); // Implement if needed
} else {
    importData();
}

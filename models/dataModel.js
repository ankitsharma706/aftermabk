const fs = require('fs');
const path = require('path');

const DOCTOR_FILE = path.join(__dirname, '../doctor.json');
const PROFILE_FILE = path.join(__dirname, '../profile.json');

// Load data synchronously on startup
let doctorsData = {};
let profileData = {};

try {
    if (fs.existsSync(DOCTOR_FILE)) {
        const rawDoctor = fs.readFileSync(DOCTOR_FILE, 'utf-8');
        doctorsData = JSON.parse(rawDoctor);
    }
    if (fs.existsSync(PROFILE_FILE)) {
        const rawProfile = fs.readFileSync(PROFILE_FILE, 'utf-8');
        profileData = JSON.parse(rawProfile);
    }
} catch (error) {
    console.error("Error loading JSON data:", error);
}

// Getters
const getDoctors = () => doctorsData.doctors || [];
const getProfile = () => profileData;

// Update helpers (in-memory for now, could write back to file if needed)
const updateProfileSection = (section, data) => {
    if (profileData[section]) {
        profileData[section] = { ...profileData[section], ...data };
        return profileData[section];
    }
    return null;
};

module.exports = {
    getDoctors,
    getProfile,
    updateProfileSection
};

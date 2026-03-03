const Profile = require('../models/Profile');

const getFullProfile = async () => {
    // Assuming single user profile for demo, or fetch by ID if context available
    return await Profile.findOne();
};

const getProfileSection = async (sectionName) => {
    const profile = await Profile.findOne();
    if (profile && profile[sectionName]) {
        return profile[sectionName];
    }
    return null;
};

const updateSection = async (sectionName, data) => {
    const profile = await Profile.findOne();
    if (!profile) {
        throw new Error('Profile not found');
    }

    if (profile[sectionName] === undefined) {
        throw new Error(`Section '${sectionName}' does not exist.`);
    }

    // Dynamic update: set the specific section
    // Check if the section is an object to merge or a direct value
    if (typeof profile[sectionName] === 'object' && !Array.isArray(profile[sectionName])) {
        profile[sectionName] = { ...profile[sectionName], ...data };
    } else {
        profile[sectionName] = data;
    }

    // For nested document updates in Mongoose, especially with Mixed types, 
    // we need to mark them as modified if we are mutating them directly, 
    // or use $set. Here we save the document.
    profile.markModified(sectionName);
    return await profile.save();
};

module.exports = {
    getFullProfile,
    getProfileSection,
    updateSection
};

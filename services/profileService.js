const dataModel = require('../models/dataModel');

const getFullProfile = async () => {
    return dataModel.getProfile();
};

const getProfileSection = async (section) => {
    const profile = dataModel.getProfile();
    return profile[section];
};

const updateSection = async (section, data) => {
    return dataModel.updateProfileSection(section, data);
};

module.exports = {
    getFullProfile,
    getProfileSection,
    updateSection
};

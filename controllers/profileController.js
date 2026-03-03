const profileService = require('../services/profileService');

const getProfile = async (req, res) => {
    try {
        const profile = await profileService.getFullProfile();
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getProfileSection = async (req, res) => {
    try {
        const section = await profileService.getProfileSection(req.params.section);
        if (!section) {
            return res.status(404).json({ error: 'Section not found' });
        }
        res.json(section);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateProfileSection = async (req, res) => {
    try {
        const updatedSection = await profileService.updateSection(req.params.section, req.body);
        res.json(updatedSection);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getProfile,
    getProfileSection,
    updateProfileSection
};

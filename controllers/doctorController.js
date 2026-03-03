const doctorService = require('../services/doctorService');

const getDoctors = async (req, res) => {
    try {
        const doctors = await doctorService.getAllDoctors();
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getDoctor = async (req, res) => {
    try {
        const doctor = await doctorService.getDoctorById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }
        res.json(doctor);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getDoctors,
    getDoctor
};

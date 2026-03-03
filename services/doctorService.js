const Doctor = require('../models/Doctor');

const getAllDoctors = async () => {
    return await Doctor.find({});
};

const getDoctorById = async (id) => {
    return await Doctor.findOne({ doctor_id: id });
};

module.exports = {
    getAllDoctors,
    getDoctorById
};

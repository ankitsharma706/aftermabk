const dataModel = require('../models/dataModel');

const getAllDoctors = async () => {
    return dataModel.getDoctors();
};

const getDoctorById = async (id) => {
    const doctors = dataModel.getDoctors();
    return doctors.find(d => d.doctor_id === id);
};

module.exports = {
    getAllDoctors,
    getDoctorById
};

'use strict';

const { Doctor } = require('../models');
const { parsePagination, paginateMeta } = require('../utils/helpers');
const { createError } = require('../middleware/error.middleware');

const createDoctor = async (req, res, next) => {
    try {
        const doctor = await Doctor.create(req.body);
        return res.status(201).json({ status: 'success', data: { doctor } });
    } catch (error) { next(error); }
};

const getAllDoctors = async (req, res, next) => {
    try {
        const { page, limit, offset } = parsePagination(req.query);
        const { specialization, location, city, type, rating_min, search, active } = req.query;

        const query = {};
        if (specialization) query.specialization = specialization;
        if (location) query.location = location;
        if (city) query.city = city;
        if (type) query.type = type;
        if (rating_min) query.rating = { $gte: parseFloat(rating_min) };
        if (active !== undefined) query.active = active === 'true';

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { hospital: { $regex: search, $options: 'i' } },
                { expertise_area: { $regex: search, $options: 'i' } },
            ];
        }

        const count = await Doctor.countDocuments(query);
        const doctors = await Doctor.find(query)
            .sort({ verified: -1, rating: -1 })
            .skip(offset)
            .limit(limit);

        return res.status(200).json({
            status: 'success',
            data: { doctors, meta: paginateMeta(count, page, limit) },
        });
    } catch (error) { next(error); }
};

const getDoctorById = async (req, res, next) => {
    try {
        const doctor = await Doctor.findById(req.params.doctorId);
        if (!doctor) return next(createError('Doctor not found.', 404));
        return res.status(200).json({ status: 'success', data: { doctor } });
    } catch (error) { next(error); }
};

const updateDoctor = async (req, res, next) => {
    try {
        const doctor = await Doctor.findByIdAndUpdate(
            req.params.doctorId,
            { $set: req.body },
            { returnDocument: 'after', runValidators: true }
        );
        if (!doctor) return next(createError('Doctor not found.', 404));
        return res.status(200).json({ status: 'success', data: { doctor } });
    } catch (error) { next(error); }
};

const deleteDoctor = async (req, res, next) => {
    try {
        const doctor = await Doctor.findByIdAndDelete(req.params.doctorId);
        if (!doctor) return next(createError('Doctor not found.', 404));
        return res.status(200).json({ status: 'success', message: 'Doctor profile deleted.' });
    } catch (error) { next(error); }
};

module.exports = { createDoctor, getAllDoctors, getDoctorById, updateDoctor, deleteDoctor };

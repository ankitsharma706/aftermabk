const db = require("../models");
const Doctor = db.doctor;
const Appointment = db.appointment;
const User = db.user;

exports.getAllDoctors = (req, res) => {
    Doctor.findAll()
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({ message: err.message || "Some error occurred while retrieving doctors." });
        });
};

exports.bookAppointment = (req, res) => {
    const appointment = {
        userId: req.userId,
        doctorId: req.body.doctorId,
        appointment_date: req.body.appointment_date,
        status: 'booked'
    };

    Appointment.create(appointment)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({ message: err.message || "Some error occurred while booking appointment." });
        });
};

exports.getUserAppointments = (req, res) => {
    Appointment.findAll({
        where: { userId: req.params.userId },
        include: [{
            model: Doctor,
            as: 'doctor' // Check default alias in index.js (belongsTo usually defaults to model name)
        }]
    })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({ message: err.message || "Some error occurred while retrieving appointments." });
        });
};

exports.createDoctor = (req, res) => {
    // Admin only, theoretically
    Doctor.create(req.body)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({ message: err.message });
        });
}

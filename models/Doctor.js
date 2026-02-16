const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    doctor_id: { type: Number, required: true, unique: true },
    full_name: { type: String, required: true },
    profile_picture_url: String,
    specialization: String,
    expertise_area: String,
    cost_per_minute: Number,
    currency: String,
    years_of_experience: Number,
    rating: Number,
    available_online: Boolean
}, {
    timestamps: true
});

module.exports = mongoose.model('Doctor', doctorSchema);

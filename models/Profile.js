const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    person_id: { type: Number, required: true, unique: true },
    full_name: String,
    age: Number,
    delivery_type: String,
    profile_picture_url: String,
    contact: {
        email: String,
        phone: String
    },
    family: {
        primary_contact_name: String,
        primary_contact_number: String,
        family_member_name: String,
        relationship: String
    },
    preferences: {
        preferred_language: String,
        supported_languages: [String],
        preferred_reminder_time: String,
        privacy_mode: String,
        data_visibility: [String]
    },
    subscription: {
        plan_name: String,
        plan_price: Number,
        plan_status: String,
        renewal_date: String
    },
    medical_profile: {
        medical_id: Number,
        person_id: Number,
        allergies: [String],
        medical_history: [String],
        current_medications: [String],
        recovery_process: String,
        doctor: {
            name: String,
            specialization: String,
            hospital: String
        },
        appointments: {
            last_visit: String,
            next_appointment: String,
            mode: String
        }
    },
    gentle_days_progress: mongoose.Schema.Types.Mixed, // Using Mixed for flexibility with nested varied structures
    care_circle: mongoose.Schema.Types.Mixed,
    resource_library: mongoose.Schema.Types.Mixed
}, {
    timestamps: true
});

module.exports = mongoose.model('Profile', profileSchema);

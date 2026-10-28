"use strict";
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const doctorSchema = new mongoose.Schema(
  {
    // ── Basic Info ─────────────────────────────────────
    name: { type: String, required: true, trim: true },

    gender: {
      type: String,
      enum: ["M", "F", "T", "O"],
    },

    qualifications: { type: String },

    practice_type: {
      type: String,
      enum: ["clinic", "hospital", "teleconsultant", "mixed"],
    },

    // ── Contact ────────────────────────────────────────
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email"],
    },

    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, "Invalid phone number"],
    },

    // ── Certification ──────────────────────────────────
    certifications_license: {
      registration_number: { type: String },
      licensing_authority: { type: String },
      specialty: { type: String },
      experience_years: { type: Number, default: 0 },
      clinic_hospital_affiliation: { type: String },
      supporting_documents: [{ type: String }],
    },

    // ── Authentication ─────────────────────────────────
    password_hash: { type: String, select: false },

    agree_on_documentations: {
      type: Boolean,
      default: false,
    },

    // ── Professional Details ───────────────────────────
    specialization: { type: String, required: true },
    sub_specialty: { type: String },
    designation: { type: String },
    credentials: { type: String },
    quote: { type: String },
    short_biography: { type: String },
    area_of_expertise: { type: String },

    profile_picture_url: { type: String },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    review_count: { type: Number, default: 0 },

    language_spoken: [{ type: String }],

    // ── Location ───────────────────────────────────────
    location: {
      full_address: { type: String },
      city: { type: String },
      pincode: { type: String },
      state: { type: String },
      country: { type: String },
    },

    facility_name: { type: String },
    facility_address: { type: String },

    // ── Session / Availability ─────────────────────────
    session: {
      available_days: [
        {
          type: String,
          enum: ["mon", "tue", "wed", "thur", "fri", "sat", "sun"],
        },
      ],

      session_fee: { type: Number, default: 0 },

      start_time: { type: String, required: true }, // "09:00"
      end_time: { type: String, required: true },

      currency: { type: String, default: "INR" },

      buffer_time: { type: Number }, // minutes
    },

    // ── Alerts ─────────────────────────────────────────
    urgent_patient_alerts: {
      enable_urgent_alerts: { type: Boolean, default: false },

      notification_channel: {
        type: String,
        enum: ["push", "sms", "email"],
      },

      quiet_hours_dnd: {
        start_time: { type: String, required: true },
        end_time: { type: String, required: true },
      },
    },

    // ── Status ─────────────────────────────────────────
    available_for_booking: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    verified: { type: Boolean, default: false },

    // ── Insurance ──────────────────────────────────────
    professional_identity: {
      policy_number: { type: String },
      insurance_provider: { type: String },
      coverage_amount: { type: String },
      expiry_date: { type: String },
      proof_of_insurance: { type: String },
    },
  },
  {
    timestamps: true,
    collection: "doctors",
  }
);


// ── Indexes ───────────────────────────────────────────
doctorSchema.index({ specialization: 1, "location.city": 1 });

doctorSchema.index({
  name: "text",
  specialization: "text",
  area_of_expertise: "text",
});


// ── Password Hash Middleware ─────────────────────────
doctorSchema.pre("save", async function (next) {
  if (!this.isModified("password_hash")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);

  next();
});


// ── Compare Password ─────────────────────────────────
doctorSchema.methods.comparePassword = async function (plainPassword) {
  if (!this.password_hash) return false;
  return bcrypt.compare(plainPassword, this.password_hash);
};


// ── Hide Sensitive Data ──────────────────────────────
doctorSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password_hash;
    return ret;
  },
});


module.exports = mongoose.model("Doctor", doctorSchema);
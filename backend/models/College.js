const mongoose = require('mongoose');

const CollegeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    domain: { type: String, trim: true }, // e.g. abc.college.edu
    address: { type: String },
    phone: { type: String },
    email: { type: String, lowercase: true },
    logo: { type: String },
    isActive: { type: Boolean, default: true },
    settings: {
      allowSelfRegistration: { type: Boolean, default: false },
      maxStudents: { type: Number, default: 5000 },
      academicYear: { type: String, default: '2024-25' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('College', CollegeSchema);

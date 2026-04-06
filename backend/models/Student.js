const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    rollNumber: { type: String, required: true, unique: true },
    course: { type: String, required: true },
    year: { type: Number, required: true, min: 1, max: 6 },
    branch: { type: String },
    phone: { type: String },
    address: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', StudentSchema);

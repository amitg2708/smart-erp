const mongoose = require('mongoose');

const AcademicCalendarSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    type: {
      type: String,
      enum: ['exam', 'holiday', 'event', 'assignment', 'meeting', 'other'],
      default: 'event',
    },
    audience: {
      type: String,
      enum: ['all', 'admin', 'faculty', 'student'],
      default: 'all',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AcademicCalendar', AcademicCalendarSchema);

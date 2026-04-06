const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    subject: { type: String, required: true },
    semester: { type: Number, required: true },
    assignmentMarks: { type: Number, default: 0, min: 0, max: 30 },
    testMarks: { type: Number, default: 0, min: 0, max: 30 },
    projectMarks: { type: Number, default: 0, min: 0, max: 40 },
    total: { type: Number, default: 0 },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Auto-calculate total before saving
ResultSchema.pre('save', function (next) {
  this.total = this.assignmentMarks + this.testMarks + this.projectMarks;
  next();
});

module.exports = mongoose.model('Result', ResultSchema);

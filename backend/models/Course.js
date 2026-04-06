const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true },
  credits: { type: Number, default: 3 },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const CourseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    department: { type: String, trim: true },
    semester: { type: Number, required: true },
    subjects: [SubjectSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', CourseSchema);

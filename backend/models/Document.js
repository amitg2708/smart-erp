const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String }, // mime type
    fileSize: { type: Number }, // bytes
    category: {
      type: String,
      enum: ['identity', 'academic', 'financial', 'medical', 'other'],
      default: 'other',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', DocumentSchema);

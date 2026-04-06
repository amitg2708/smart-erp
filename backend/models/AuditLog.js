const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userEmail: { type: String },
    userRole: { type: String },
    action: { type: String, required: true }, // e.g. CREATE, UPDATE, DELETE
    entity: { type: String, required: true }, // e.g. Fee, Attendance, User
    entityId: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
    method: { type: String },
    path: { type: String },
    statusCode: { type: Number },
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ entity: 1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);

const mongoose = require('mongoose');

const PaymentHistorySchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  paidDate: { type: Date, default: Date.now },
  method: { type: String, enum: ['cash', 'online', 'cheque', 'dd', 'other'], default: 'cash' },
  note: { type: String },
  transactionId: { type: String },
  receiptNo: { type: String },
});

const InstallmentSchema = new mongoose.Schema({
  dueDate: { type: Date, required: true },
  amount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
  paidDate: { type: Date },
});

const FeeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    semester: { type: Number, required: true },
    totalFees: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    pendingAmount: { type: Number, default: 0 },
    lateFee: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'overdue'],
      default: 'pending',
    },
    dueDate: { type: Date },
    description: { type: String },
    installments: [InstallmentSchema],
    paymentHistory: [PaymentHistorySchema],
  },
  { timestamps: true }
);

// Auto-calculate pending and status before saving
FeeSchema.pre('save', function (next) {
  this.pendingAmount = this.totalFees + this.lateFee - this.paidAmount;
  const total = this.totalFees + this.lateFee;
  if (this.paidAmount >= total) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
  } else if (this.dueDate && new Date() > new Date(this.dueDate)) {
    this.status = 'overdue';
  } else {
    this.status = 'pending';
  }
  next();
});

module.exports = mongoose.model('Fee', FeeSchema);

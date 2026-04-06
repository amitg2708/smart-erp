const express = require('express');
const router = express.Router();
const Fee = require('../models/Fee');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');
const { validate, feeSchemas } = require('../middleware/validate');

/**
 * @swagger
 * /api/fee:
 *   get:
 *     summary: Get fee records (paginated). Admin gets all; Student gets own.
 *     tags: [Fees]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, partial, paid, overdue] }
 *       - in: query
 *         name: semester
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated fee records
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', protect, authorize('admin', 'student'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    let filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.semester) filter.semester = parseInt(req.query.semester);

    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) return res.status(404).json({ message: 'Student profile not found' });
      filter.studentId = student._id;
    }

    const total = await Fee.countDocuments(filter);
    const fees = await Fee.find(filter)
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({ data: fees, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/fee/student/{studentId}:
 *   get:
 *     summary: Get fee records for a specific student
 *     tags: [Fees]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Student fee records }
 */
router.get('/student/:studentId', protect, authorize('admin'), async (req, res) => {
  try {
    const fees = await Fee.find({ studentId: req.params.studentId })
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
      .lean();
    res.json(fees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/fee:
 *   post:
 *     summary: Create a fee record
 *     tags: [Fees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Fee'
 *     responses:
 *       201: { description: Fee record created }
 */
router.post('/', protect, authorize('admin'), auditLogger('Fee'), validate(feeSchemas.create), async (req, res) => {
  try {
    const { studentId, semester, totalFees, paidAmount, dueDate, description, lateFee, installments } = req.body;
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const fee = await Fee.create({ studentId, semester, totalFees, paidAmount: paidAmount || 0, lateFee: lateFee || 0, dueDate, description, installments: installments || [] });
    await fee.populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } });
    res.status(201).json({ message: 'Fee record created successfully', fee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @POST /api/fee/:id/payment
router.post('/:id/payment', protect, authorize('admin'), auditLogger('Fee'), validate(feeSchemas.payment), async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: 'Fee record not found' });
    const { amount, method, note, transactionId, receiptNo } = req.body;

    let computedLateFee = fee.lateFee || 0;
    if (fee.dueDate && new Date() > new Date(fee.dueDate) && fee.status !== 'paid') {
      const daysOverdue = Math.floor((Date.now() - new Date(fee.dueDate)) / (1000 * 60 * 60 * 24));
      computedLateFee = Math.min(daysOverdue * 10, fee.totalFees * 0.1);
    }
    fee.lateFee = computedLateFee;
    fee.paidAmount += Number(amount);
    fee.paymentHistory.push({ amount, method: method || 'cash', note, transactionId, receiptNo });
    await fee.save();
    await fee.populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } });
    res.json({ message: 'Payment recorded successfully', fee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @POST /api/fee/:id/installment
router.post('/:id/installment', protect, authorize('admin'), async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: 'Fee record not found' });
    const { dueDate, amount } = req.body;
    if (!dueDate || !amount) return res.status(400).json({ message: 'dueDate and amount required' });
    fee.installments.push({ dueDate, amount });
    await fee.save();
    res.json({ message: 'Installment added', fee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @PUT /api/fee/:id
router.put('/:id', protect, authorize('admin'), auditLogger('Fee'), validate(feeSchemas.update), async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: 'Fee record not found' });
    const { paidAmount, totalFees, dueDate, description, lateFee } = req.body;
    if (paidAmount !== undefined) fee.paidAmount = paidAmount;
    if (totalFees !== undefined) fee.totalFees = totalFees;
    if (dueDate !== undefined) fee.dueDate = dueDate;
    if (description !== undefined) fee.description = description;
    if (lateFee !== undefined) fee.lateFee = lateFee;
    await fee.save();
    res.json({ message: 'Fee updated successfully', fee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @DELETE /api/fee/:id
router.delete('/:id', protect, authorize('admin'), auditLogger('Fee'), async (req, res) => {
  try {
    const fee = await Fee.findByIdAndDelete(req.params.id);
    if (!fee) return res.status(404).json({ message: 'Fee record not found' });
    res.json({ message: 'Fee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

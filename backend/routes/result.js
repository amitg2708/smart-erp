const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');
const { validate, resultSchemas } = require('../middleware/validate');

/**
 * @swagger
 * /api/result:
 *   get:
 *     summary: Get results (paginated). Faculty/Admin gets all; Student gets own.
 *     tags: [Results]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: semester
 *         schema: { type: integer }
 *       - in: query
 *         name: subject
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    let filter = {};
    if (req.query.semester) filter.semester = parseInt(req.query.semester);
    if (req.query.subject) filter.subject = { $regex: req.query.subject, $options: 'i' };

    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) return res.status(404).json({ message: 'Student profile not found' });
      filter.studentId = student._id;
    }

    const total = await Result.countDocuments(filter);
    const results = await Result.find(filter)
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
      .populate('addedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({ data: results, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/result/student/{studentId}:
 *   get:
 *     summary: Get all results for a specific student
 *     tags: [Results]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Student results }
 */
router.get('/student/:studentId', protect, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const results = await Result.find({ studentId: req.params.studentId })
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
      .sort({ semester: 1, subject: 1 })
      .lean();
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/result:
 *   post:
 *     summary: Add a result record
 *     tags: [Results]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Result'
 *     responses:
 *       201: { description: Result added }
 *       404: { description: Student not found }
 */
router.post('/', protect, authorize('admin', 'faculty'), validate(resultSchemas.create), async (req, res) => {
  try {
    const { studentId, subject, semester, assignmentMarks, testMarks, projectMarks } = req.body;
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const result = await Result.create({ studentId, subject, semester, assignmentMarks, testMarks, projectMarks, addedBy: req.user._id });
    await result.populate([
      { path: 'studentId', populate: { path: 'userId', select: 'name email' } },
      { path: 'addedBy', select: 'name' },
    ]);
    res.status(201).json({ message: 'Result added successfully', result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @PUT /api/result/:id
router.put('/:id', protect, authorize('admin', 'faculty'), validate(resultSchemas.update), async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ message: 'Result not found' });
    const { assignmentMarks, testMarks, projectMarks, subject, semester } = req.body;
    if (assignmentMarks !== undefined) result.assignmentMarks = assignmentMarks;
    if (testMarks !== undefined) result.testMarks = testMarks;
    if (projectMarks !== undefined) result.projectMarks = projectMarks;
    if (subject) result.subject = subject;
    if (semester) result.semester = semester;
    await result.save();
    res.json({ message: 'Result updated successfully', result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @DELETE /api/result/:id - Admin only
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const result = await Result.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Result not found' });
    res.json({ message: 'Result deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

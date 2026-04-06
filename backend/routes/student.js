const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { validate, studentSchemas } = require('../middleware/validate');

/**
 * @swagger
 * /api/student:
 *   get:
 *     summary: Get all students (paginated) or own profile for students
 *     tags: [Students]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name, email, roll number
 *       - in: query
 *         name: course
 *         schema: { type: string }
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated list of students
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id }).populate('userId', 'name email phone');
      if (!student) return res.status(404).json({ message: 'Student profile not found' });
      return res.json(student);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.course) filter.course = { $regex: req.query.course, $options: 'i' };
    if (req.query.year) filter.year = parseInt(req.query.year);
    if (req.query.branch) filter.branch = { $regex: req.query.branch, $options: 'i' };

    let query = Student.find(filter)
      .populate('userId', 'name email isActive')
      .sort({ createdAt: -1 });

    // Search by roll number or name (post-populate)
    if (req.query.search) {
      const search = req.query.search;
      filter.$or = [
        { rollNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Student.countDocuments(filter);
    const students = await Student.find(filter)
      .populate('userId', 'name email isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      data: students,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/student/{id}:
 *   get:
 *     summary: Get single student by ID
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Student details }
 *       404: { description: Student not found }
 */
router.get('/:id', protect, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('userId', 'name email').lean();
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @POST /api/student - Admin only
router.post('/', protect, authorize('admin'), validate(studentSchemas.create), async (req, res) => {
  try {
    const { userId, rollNumber, course, year, branch, phone, address } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const existing = await Student.findOne({ userId });
    if (existing) return res.status(400).json({ message: 'Student profile already exists for this user' });

    const existingRoll = await Student.findOne({ rollNumber });
    if (existingRoll) return res.status(400).json({ message: 'Roll number already exists' });

    const student = await Student.create({ userId, rollNumber, course, year, branch, phone, address });
    await student.populate('userId', 'name email');
    res.status(201).json({ message: 'Student created successfully', student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @PUT /api/student/:id - Admin only
router.put('/:id', protect, authorize('admin'), validate(studentSchemas.update), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('userId', 'name email');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student updated successfully', student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @DELETE /api/student/:id - Admin only
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

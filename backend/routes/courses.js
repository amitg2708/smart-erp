const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { protect, authorize } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');

// @GET /api/courses
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.semester) filter.semester = Number(req.query.semester);
    const courses = await Course.find(filter)
      .populate('subjects.facultyId', 'name email')
      .sort({ semester: 1, name: 1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/courses/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('subjects.facultyId', 'name email');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @POST /api/courses - Admin only
router.post('/', protect, authorize('admin'), auditLogger('Course'), async (req, res) => {
  try {
    const { name, code, department, semester, subjects } = req.body;
    if (!name || !code || !semester) return res.status(400).json({ message: 'name, code, semester required' });
    const existing = await Course.findOne({ code });
    if (existing) return res.status(400).json({ message: 'Course code already exists' });
    const course = await Course.create({ name, code, department, semester, subjects: subjects || [], createdBy: req.user._id });
    res.status(201).json({ message: 'Course created', course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @PUT /api/courses/:id - Admin only
router.put('/:id', protect, authorize('admin'), auditLogger('Course'), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course updated', course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @DELETE /api/courses/:id - Admin only
router.delete('/:id', protect, authorize('admin'), auditLogger('Course'), async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

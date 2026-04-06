const express = require('express');
const router = express.Router();
const College = require('../models/College');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/college:
 *   get:
 *     summary: Get all colleges (Super-Admin)
 *     tags: [Colleges]
 *     responses:
 *       200: { description: List of colleges }
 */
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const colleges = await College.find().sort({ name: 1 }).lean();
    res.json(colleges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/college:
 *   post:
 *     summary: Create a college
 *     tags: [Colleges]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code]
 *             properties:
 *               name: { type: string }
 *               code: { type: string }
 *               domain: { type: string }
 *               address: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *     responses:
 *       201: { description: College created }
 */
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, code, domain, address, phone, email, settings } = req.body;
    if (!name || !code) return res.status(400).json({ message: 'College name and code are required' });
    const existing = await College.findOne({ code: code.toUpperCase() });
    if (existing) return res.status(400).json({ message: 'College code already exists' });
    const college = await College.create({ name, code, domain, address, phone, email, settings });
    res.status(201).json({ message: 'College created successfully', college });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/college/:id
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const college = await College.findById(req.params.id).lean();
    if (!college) return res.status(404).json({ message: 'College not found' });
    res.json(college);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @PUT /api/college/:id
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const college = await College.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!college) return res.status(404).json({ message: 'College not found' });
    res.json({ message: 'College updated', college });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @DELETE /api/college/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const college = await College.findByIdAndDelete(req.params.id);
    if (!college) return res.status(404).json({ message: 'College not found' });
    res.json({ message: 'College deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

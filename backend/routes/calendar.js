const express = require('express');
const router = express.Router();
const AcademicCalendar = require('../models/AcademicCalendar');
const { protect, authorize } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');

// @GET /api/calendar - All authenticated users
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.month) {
      const month = new Date(req.query.month);
      const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
      filter.startDate = { $gte: month, $lt: nextMonth };
    }
    // Filter by audience
    if (req.user.role !== 'admin') {
      filter.$or = [{ audience: 'all' }, { audience: req.user.role }];
    }
    const events = await AcademicCalendar.find(filter)
      .populate('createdBy', 'name email')
      .sort({ startDate: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @POST /api/calendar - Admin only
router.post('/', protect, authorize('admin'), auditLogger('AcademicCalendar'), async (req, res) => {
  try {
    const { title, description, startDate, endDate, type, audience } = req.body;
    if (!title || !startDate) return res.status(400).json({ message: 'Title and startDate are required' });
    const event = await AcademicCalendar.create({ title, description, startDate, endDate, type, audience, createdBy: req.user._id });
    res.status(201).json({ message: 'Event created', event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @PUT /api/calendar/:id - Admin only
router.put('/:id', protect, authorize('admin'), auditLogger('AcademicCalendar'), async (req, res) => {
  try {
    const event = await AcademicCalendar.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event updated', event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @DELETE /api/calendar/:id - Admin only
router.delete('/:id', protect, authorize('admin'), auditLogger('AcademicCalendar'), async (req, res) => {
  try {
    const event = await AcademicCalendar.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

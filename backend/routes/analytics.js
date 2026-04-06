const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const Fee = require('../models/Fee');
const Attendance = require('../models/Attendance');
const { protect, authorize } = require('../middleware/auth');

// @GET /api/analytics/overview - Admin only
router.get('/overview', protect, authorize('admin'), async (req, res) => {
  try {
    const [totalStudents, totalFaculty, fees, attendanceCount, presentCount] = await Promise.all([
      Student.countDocuments(),
      User.countDocuments({ role: 'faculty' }),
      Fee.find(),
      Attendance.countDocuments(),
      Attendance.countDocuments({ status: { $in: ['present', 'late'] } }),
    ]);

    const totalFeesCollected = fees.reduce((sum, f) => sum + f.paidAmount, 0);
    const totalFeesPending = fees.reduce((sum, f) => sum + f.pendingAmount, 0);
    const avgAttendance = attendanceCount > 0 ? Math.round((presentCount / attendanceCount) * 100) : 0;

    res.json({
      totalStudents,
      totalFaculty,
      totalFeesCollected,
      totalFeesPending,
      avgAttendance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/analytics/fees - Monthly fee collection (last 6 months)
router.get('/fees', protect, authorize('admin'), async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const fees = await Fee.find({ createdAt: { $gte: sixMonthsAgo } });

    // Build a map: YYYY-MM -> { collected, pending }
    const monthMap = {};
    fees.forEach((f) => {
      const key = f.createdAt.toISOString().substring(0, 7); // "2025-01"
      if (!monthMap[key]) monthMap[key] = { month: key, collected: 0, pending: 0 };
      monthMap[key].collected += f.paidAmount;
      monthMap[key].pending += f.pendingAmount;
    });

    // Fill in any missing months in range
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      result.push(monthMap[key] || { month: key, collected: 0, pending: 0 });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/analytics/fees/status - Fee status distribution
router.get('/fees/status', protect, authorize('admin'), async (req, res) => {
  try {
    const [paid, partial, pending] = await Promise.all([
      Fee.countDocuments({ status: 'paid' }),
      Fee.countDocuments({ status: 'partial' }),
      Fee.countDocuments({ status: 'pending' }),
    ]);
    res.json([
      { name: 'Paid', value: paid },
      { name: 'Partial', value: partial },
      { name: 'Pending', value: pending },
    ]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/analytics/attendance - Per-subject attendance %
router.get('/attendance', protect, authorize('admin'), async (req, res) => {
  try {
    const records = await Attendance.find();
    const subjectMap = {};
    records.forEach((r) => {
      if (!subjectMap[r.subject]) subjectMap[r.subject] = { total: 0, present: 0 };
      subjectMap[r.subject].total += 1;
      if (r.status === 'present' || r.status === 'late') subjectMap[r.subject].present += 1;
    });
    const result = Object.entries(subjectMap).map(([subject, data]) => ({
      subject,
      percentage: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

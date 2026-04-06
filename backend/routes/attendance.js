const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');

// In-memory QR token store: { token: { subject, date, lat, lng, expiresAt, markedBy } }
const qrSessions = new Map();

// @POST /api/attendance/qr/generate - Faculty/Admin generates QR session
router.post('/qr/generate', protect, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { subject, date, lat, lng, validMinutes = 15 } = req.body;
    if (!subject || !date) return res.status(400).json({ message: 'subject and date are required' });

    const token = uuidv4();
    const expiresAt = Date.now() + validMinutes * 60 * 1000;

    qrSessions.set(token, { subject, date, lat: lat || null, lng: lng || null, expiresAt, markedBy: req.user._id });

    // Generate QR as base64 data URL
    const qrPayload = JSON.stringify({ token, subject, date });
    const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 300 });

    res.json({ token, qrDataUrl, expiresAt, validMinutes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @POST /api/attendance/qr/validate - Student scans QR to mark presence
router.post('/qr/validate', protect, authorize('student'), async (req, res) => {
  try {
    const { token, lat, lng } = req.body;
    if (!token) return res.status(400).json({ message: 'QR token is required' });

    const session = qrSessions.get(token);
    if (!session) return res.status(404).json({ message: 'Invalid QR code' });
    if (Date.now() > session.expiresAt) {
      qrSessions.delete(token);
      return res.status(410).json({ message: 'QR code has expired' });
    }

    // Location validation (if faculty provided coords, require student to be within 200m)
    if (session.lat && session.lng && lat && lng) {
      const R = 6371000;
      const dLat = ((lat - session.lat) * Math.PI) / 180;
      const dLng = ((lng - session.lng) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos((session.lat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (distance > 200) {
        return res.status(403).json({ message: 'You are not within the allowed classroom location (200m radius)' });
      }
    }

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const dateObj = new Date(session.date);
    await Attendance.findOneAndUpdate(
      { studentId: student._id, subject: session.subject, date: dateObj },
      {
        status: 'present',
        markedBy: session.markedBy,
        qrToken: token,
        validatedViaQR: true,
        location: lat && lng ? { lat, lng } : undefined,
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'Attendance marked successfully via QR!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @POST /api/attendance/bulk - Faculty/Admin marks attendance for multiple students
router.post('/bulk', protect, authorize('faculty', 'admin'), auditLogger('Attendance'), async (req, res) => {
  try {
    const { records } = req.body;
    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'records array is required' });
    }
    const ops = records.map((r) => ({
      updateOne: {
        filter: { studentId: r.studentId, subject: r.subject, date: new Date(r.date) },
        update: { $set: { status: r.status, markedBy: req.user._id } },
        upsert: true,
      },
    }));
    await Attendance.bulkWrite(ops);
    res.json({ message: 'Attendance saved successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/attendance/my - Student views own attendance
router.get('/my', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });
    const records = await Attendance.find({ studentId: student._id }).sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/attendance/summary/:studentId
router.get('/summary/:studentId', protect, authorize('admin', 'faculty', 'student'), async (req, res) => {
  try {
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student || student._id.toString() !== req.params.studentId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    const records = await Attendance.find({ studentId: req.params.studentId });
    const subjectMap = {};
    records.forEach((r) => {
      if (!subjectMap[r.subject]) subjectMap[r.subject] = { total: 0, present: 0 };
      subjectMap[r.subject].total += 1;
      if (r.status === 'present' || r.status === 'late') subjectMap[r.subject].present += 1;
    });
    const summary = Object.entries(subjectMap).map(([subject, data]) => ({
      subject,
      total: data.total,
      present: data.present,
      percentage: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
    }));
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/attendance
router.get('/', protect, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.studentId) filter.studentId = req.query.studentId;
    const records = await Attendance.find(filter)
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
      .sort({ date: -1 })
      .limit(500);
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

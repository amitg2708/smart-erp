const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Attendance = require('../models/Attendance');
const Fee = require('../models/Fee');
const Result = require('../models/Result');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');

// Helper: Get student info
async function getStudentPopulated(studentId) {
  return Student.findById(studentId).populate('userId', 'name email');
}

// @GET /api/export/attendance/pdf
router.get('/attendance/pdf', protect, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.studentId) filter.studentId = req.query.studentId;

    const records = await Attendance.find(filter)
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
      .sort({ date: -1 })
      .limit(500);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.pdf');

    const doc = new PDFDocument({ margin: 30 });
    doc.pipe(res);

    doc.fontSize(18).font('Helvetica-Bold').text('Smart College ERP', { align: 'center' });
    doc.fontSize(13).font('Helvetica').text('Attendance Report', { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown();

    // Table header
    const cols = [30, 130, 270, 380, 460];
    const headerY = doc.y;
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('#', cols[0], headerY);
    doc.text('Student', cols[1], headerY);
    doc.text('Subject', cols[2], headerY);
    doc.text('Date', cols[3], headerY);
    doc.text('Status', cols[4], headerY);
    doc.moveDown(0.5);
    doc.moveTo(30, doc.y).lineTo(570, doc.y).stroke();
    doc.moveDown(0.3);

    doc.font('Helvetica').fontSize(9);
    records.forEach((r, i) => {
      const name = r.studentId?.userId?.name || 'N/A';
      const y = doc.y;
      doc.text(String(i + 1), cols[0], y);
      doc.text(name.substring(0, 20), cols[1], y);
      doc.text((r.subject || '').substring(0, 20), cols[2], y);
      doc.text(new Date(r.date).toLocaleDateString(), cols[3], y);
      doc.text(r.status || '', cols[4], y);
      doc.moveDown(0.5);
      if (doc.y > 700) doc.addPage();
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/export/fees/excel
router.get('/fees/excel', protect, authorize('admin'), async (req, res) => {
  try {
    const fees = await Fee.find()
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Smart College ERP';
    const sheet = workbook.addWorksheet('Fee Report');

    sheet.columns = [
      { header: '#', key: 'idx', width: 5 },
      { header: 'Student Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Semester', key: 'semester', width: 10 },
      { header: 'Total Fees', key: 'totalFees', width: 14 },
      { header: 'Paid', key: 'paidAmount', width: 14 },
      { header: 'Pending', key: 'pendingAmount', width: 14 },
      { header: 'Late Fee', key: 'lateFee', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Due Date', key: 'dueDate', width: 14 },
    ];

    // Style header row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    fees.forEach((f, i) => {
      sheet.addRow({
        idx: i + 1,
        name: f.studentId?.userId?.name || 'N/A',
        email: f.studentId?.userId?.email || 'N/A',
        semester: f.semester,
        totalFees: f.totalFees,
        paidAmount: f.paidAmount,
        pendingAmount: f.pendingAmount,
        lateFee: f.lateFee || 0,
        status: f.status,
        dueDate: f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '-',
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=fees_report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/export/results/pdf
router.get('/results/pdf', protect, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const results = await Result.find()
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
      .sort({ semester: 1, subject: 1 })
      .limit(500);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=results_report.pdf');

    const doc = new PDFDocument({ margin: 30 });
    doc.pipe(res);

    doc.fontSize(18).font('Helvetica-Bold').text('Smart College ERP', { align: 'center' });
    doc.fontSize(13).font('Helvetica').text('Results / Marks Report', { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown();

    const cols = [30, 130, 260, 360, 410, 470];
    const headerY = doc.y;
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('#', cols[0], headerY);
    doc.text('Student', cols[1], headerY);
    doc.text('Subject', cols[2], headerY);
    doc.text('Sem', cols[3], headerY);
    doc.text('Marks', cols[4], headerY);
    doc.text('Grade', cols[5], headerY);
    doc.moveDown(0.5);
    doc.moveTo(30, doc.y).lineTo(570, doc.y).stroke();
    doc.moveDown(0.3);

    doc.font('Helvetica').fontSize(9);
    results.forEach((r, i) => {
      const name = r.studentId?.userId?.name || 'N/A';
      const y = doc.y;
      doc.text(String(i + 1), cols[0], y);
      doc.text(name.substring(0, 20), cols[1], y);
      doc.text((r.subject || '').substring(0, 18), cols[2], y);
      doc.text(String(r.semester || ''), cols[3], y);
      doc.text(String(r.marks || ''), cols[4], y);
      doc.text(r.grade || '', cols[5], y);
      doc.moveDown(0.5);
      if (doc.y > 700) doc.addPage();
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

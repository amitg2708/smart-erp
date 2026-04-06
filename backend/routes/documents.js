const express = require('express');
const router = express.Router();
const path = require('path');
const Document = require('../models/Document');
const Student = require('../models/Student');
const { handleUpload } = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');

// @POST /api/documents/upload - Student uploads a document
router.post('/upload', protect, authorize('student', 'admin'), handleUpload('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const { title, category } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    let studentId;
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) return res.status(404).json({ message: 'Student profile not found' });
      studentId = student._id;
    } else {
      studentId = req.body.studentId;
      if (!studentId) return res.status(400).json({ message: 'studentId is required for admin' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const doc = await Document.create({
      studentId,
      uploadedBy: req.user._id,
      title,
      fileUrl,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      category: category || 'other',
    });

    res.status(201).json({ message: 'Document uploaded successfully', document: doc });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/documents/my - Student's own documents
router.get('/my', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const docs = await Document.find({ studentId: student._id })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/documents/student/:studentId - Admin/Faculty view student docs
router.get('/student/:studentId', protect, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const docs = await Document.find({ studentId: req.params.studentId })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @DELETE /api/documents/:id
router.delete('/:id', protect, authorize('student', 'admin'), async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    // Students can only delete their own
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student || doc.studentId.toString() !== student._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Delete physical file
    const fs = require('fs');
    const filePath = path.join(__dirname, '..', doc.fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB) || 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: ['application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
};
const ALL_ALLOWED = [...ALLOWED_TYPES.image, ...ALLOWED_TYPES.document];

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Separate folders by type
    const subfolder = ALLOWED_TYPES.image.includes(file.mimetype) ? 'images' : 'documents';
    const dest = path.join(uploadDir, subfolder);
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALL_ALLOWED.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: JPEG, PNG, PDF, DOC, DOCX, XLS, XLSX`), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter,
});

// Middleware wrapper to handle multer errors gracefully
const handleUpload = (field) => (req, res, next) => {
  const uploadMiddleware = upload.single(field);
  uploadMiddleware(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: `File too large. Maximum size is ${MAX_SIZE_MB}MB.` });
    }
    return res.status(400).json({ message: err.message || 'File upload error' });
  });
};

module.exports = { upload, handleUpload };

import express from 'express';
import multer from 'multer';
import path from 'path';
import { register, login, getCurrentUser } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import fs from 'fs';

const router = express.Router();

// Ensure uploads directory exists
const createUploadsDir = () => {
  const uploadsPath = path.join(process.cwd(), '..', 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  return uploadsPath;
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsPath = createUploadsDir();
    // Create subdirectory based on file type
    const fileType = file.fieldname.includes('idProof') ? 'id-proofs' :
                    file.fieldname === 'lawDegree' ? 'degrees' :
                    file.fieldname === 'studentId' ? 'student-ids' :
                    'resumes';
    
    const finalPath = path.join(uploadsPath, fileType);
    fs.mkdirSync(finalPath, { recursive: true });
    cb(null, finalPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'idProofFront': ['image/jpeg', 'image/png', 'application/pdf'],
    'idProofBack': ['image/jpeg', 'image/png', 'application/pdf'],
    'lawDegree': ['application/pdf'],
    'studentId': ['image/jpeg', 'image/png', 'application/pdf'],
    'resume': ['application/pdf']
  };

  if (allowedTypes[file.fieldname]?.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${file.fieldname}. Allowed types: ${allowedTypes[file.fieldname].join(', ')}`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Define required fields based on user type
const validateRequiredFiles = (req, res, next) => {
  const userType = req.body.userType;
  const files = req.files || {};

  try {
    // Common required files
    if (!files.idProofFront) {
      throw new Error('ID Proof (front) is required');
    }

    // User type specific validations
    if (userType === 'advocate') {
      if (!files.lawDegree) {
        throw new Error('Law degree certificate is required for advocates');
      }
    } else if (userType === 'intern') {
      if (!files.studentId) {
        throw new Error('Student ID is required for interns');
      }
      if (!files.resume) {
        throw new Error('Resume is required for interns');
      }
    }

    next();
  } catch (error) {
    // Clean up any uploaded files if validation fails
    Object.values(files).forEach(fileArray => {
      fileArray.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    });
    res.status(400).json({ message: error.message });
  }
};

const uploadFields = upload.fields([
  { name: 'idProofFront', maxCount: 1 },
  { name: 'idProofBack', maxCount: 1 },
  { name: 'lawDegree', maxCount: 1 },
  { name: 'studentId', maxCount: 1 },
  { name: 'resume', maxCount: 1 }
]);

// Apply upload middleware and validation
router.post('/register', uploadFields, validateRequiredFiles, register);
router.post('/login', login);
router.get('/me', protect, getCurrentUser);

export default router; 
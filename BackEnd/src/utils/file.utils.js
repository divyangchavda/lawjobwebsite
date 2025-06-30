import fs from 'fs';
import path from 'path';

// Delete file
export const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

// Validate file type
export const validateFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.mimetype);
};

// Process file path
export const processFilePath = (file) => {
  if (!file) return null;
  return path.relative(process.cwd(), file.path).replace(/\\/g, '/');
};

// Create directory if not exists
export const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}; 
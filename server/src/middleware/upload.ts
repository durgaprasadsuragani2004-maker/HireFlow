import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { AppError } from './errorHandler';

// Determine safe upload directory (fallback to OS tempdir in serverless/read-only environments)
export const getUploadDirectory = (): string => {
  if (process.env.VERCEL) {
    return path.join(os.tmpdir(), 'hireflow-uploads');
  }
  return env.UPLOAD_DIR;
};

const initialUploadDir = getUploadDirectory();
try {
  if (!fs.existsSync(initialUploadDir)) {
    fs.mkdirSync(initialUploadDir, { recursive: true });
  }
} catch {
  // In read-only serverless environments, S3 is used and local directory creation may be restricted
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = getUploadDirectory();
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch {
      // Ignore directory creation errors if read-only
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only PDF, DOC, and DOCX documents are allowed', 400) as any);
  }
};

export const uploadResume = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
});

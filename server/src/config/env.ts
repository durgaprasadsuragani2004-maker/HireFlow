import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5001', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'file:./prisma/dev.db',
  JWT_SECRET: process.env.JWT_SECRET || 'super-secret-hireflow-jwt-access-key-2026-production-grade',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'super-secret-hireflow-jwt-refresh-key-2026-production-grade',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  SERVER_URL: process.env.SERVER_URL || 'http://localhost:5001',
  CORS_ORIGIN: process.env.CORS_ORIGIN || process.env.CLIENT_URL || 'http://localhost:3000',
  STORAGE_TYPE: process.env.STORAGE_TYPE || 'local',
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads'),
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || 'hireflow-resumes',
};

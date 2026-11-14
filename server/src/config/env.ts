import dotenv from 'dotenv';
import path from 'path';

// 1. Load server-specific .env first
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// 2. Load root .env.local and .env if present (e.g. Neon CLI pulls)
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const resolvePort = (): number => {
  const portStr = process.env.PORT;
  if (portStr && portStr.trim().length > 0) {
    const parsed = parseInt(portStr.trim(), 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 5001;
};

const resolveServerUrl = (): string => {
  const isProd = (process.env.NODE_ENV || 'development') === 'production';
  const customUrl = process.env.SERVER_URL?.trim();
  const renderUrl = process.env.RENDER_EXTERNAL_URL?.trim();

  // If on Render or external proxy URL is available, use it directly
  if (renderUrl && renderUrl.length > 0) {
    return renderUrl.replace(/\/+$/, '');
  }

  // If a custom SERVER_URL is provided, ensure production does not use a localhost URL
  if (customUrl && customUrl.length > 0) {
    const isLocal = customUrl.includes('localhost') || customUrl.includes('127.0.0.1');
    if (!isProd || !isLocal) {
      return customUrl.replace(/\/+$/, '');
    }
  }

  // Production fallback to the live Render backend URL
  if (isProd) {
    return 'https://dphireflow.onrender.com';
  }

  return `http://localhost:${resolvePort()}`;
};

const resolveDatabaseUrl = (): string => {
  const url = process.env.DATABASE_URL?.trim();
  if (!url && process.env.NODE_ENV !== 'test') {
    throw new Error(
      '[HireFlow Configuration Error] DATABASE_URL is missing. ' +
      'Please configure DATABASE_URL with your Neon PostgreSQL connection string.'
    );
  }
  return url || '';
};

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: resolvePort(),
  HOST: process.env.HOST || '0.0.0.0',
  DATABASE_URL: resolveDatabaseUrl(),
  DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED || process.env.DIRECT_URL || process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'super-secret-hireflow-jwt-access-key-2026-production-grade',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'super-secret-hireflow-jwt-refresh-key-2026-production-grade',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  SERVER_URL: resolveServerUrl(),
  CORS_ORIGIN: process.env.CORS_ORIGIN || process.env.CLIENT_URL || 'http://localhost:3000',
  STORAGE_TYPE: process.env.STORAGE_TYPE || 'local',
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads'),
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || 'hireflow-resumes',
};

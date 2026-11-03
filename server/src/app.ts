import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { prisma } from './config/database';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { setupSwagger } from './swagger/swagger';

const app: Express = express();

// Trust reverse proxy (e.g. Nginx, Cloudflare, AWS ALB, Render, Vercel)
app.set('trust proxy', 1);

// Security Middleware (Helmet)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Production-aware CORS Configuration
const rawOrigins = [
  ...env.CORS_ORIGIN.split(','),
  env.CLIENT_URL,
];

const allowsWildcard = rawOrigins.some((o) => o.trim() === '*');

const allowedOrigins = new Set(
  rawOrigins
    .map((o) => o.trim().replace(/\/+$/, '').toLowerCase())
    .filter((o) => o && o !== '*')
);

if (env.NODE_ENV !== 'production') {
  allowedOrigins.add('http://localhost:3000');
  allowedOrigins.add('http://127.0.0.1:3000');
}

const isOriginAllowed = (origin: string): boolean => {
  const normalized = origin.trim().replace(/\/+$/, '').toLowerCase();

  // Allow if explicitly configured in CORS_ORIGIN or CLIENT_URL
  if (allowedOrigins.has(normalized)) {
    return true;
  }

  // Allow wildcard if configured
  if (allowsWildcard) {
    return true;
  }

  // Development/local origins
  if (
    env.NODE_ENV !== 'production' &&
    (normalized.startsWith('http://localhost:') || normalized.startsWith('http://127.0.0.1:'))
  ) {
    return true;
  }

  // Support Vercel deployment domains (preview or production domains matching *.vercel.app)
  if (/^https:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/.test(normalized)) {
    return true;
  }

  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }

      // Reject origin cleanly without throwing 500 error
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    optionsSuccessStatus: 204,
  })
);

// Rate Limiting
if (env.NODE_ENV !== 'test') {
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  });
  app.use('/api', globalLimiter);

  // Strict rate limiter on authentication endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 attempts per 15 minutes per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
}

// Logging & Body Parsers
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger Documentation
setupSwagger(app);

// Production Health Check with Database Connectivity Verification
app.get('/api/health', async (_req: Request, res: Response) => {
  let dbStatus = 'healthy';
  try {
    await prisma.user.findFirst({ select: { id: true } });
  } catch {
    dbStatus = 'unreachable';
  }

  const isHealthy = dbStatus === 'healthy';
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    version: '1.0.0',
    service: 'HireFlow ATS Backend',
  });
});

// Mount API routes
app.use('/api', routes);

// 404 Catch-all
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Requested API endpoint not found',
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;

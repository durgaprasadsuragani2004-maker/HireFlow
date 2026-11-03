import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const PORT = env.PORT;
const HOST = env.HOST || '0.0.0.0';
const isProd = env.NODE_ENV === 'production';
const serverUrl = env.SERVER_URL;

const server = app.listen(PORT, HOST, () => {
  logger.info(`🚀 HireFlow ATS Backend running on ${HOST}:${PORT} [environment: ${env.NODE_ENV}]`);
  if (isProd) {
    logger.info(`🌐 Production Service URL: ${serverUrl}`);
    logger.info(`📚 Swagger Documentation available at ${serverUrl}/api/docs`);
    logger.info(`🩺 Health check endpoint at ${serverUrl}/api/health`);
  } else {
    logger.info(`💻 Local Development URL: http://localhost:${PORT}`);
    logger.info(`📚 Swagger Documentation available at http://localhost:${PORT}/api/docs`);
    logger.info(`🩺 Health check endpoint at http://localhost:${PORT}/api/health`);
  }
});

const gracefulShutdown = () => {
  logger.info('Shutting down server gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

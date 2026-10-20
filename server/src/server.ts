import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.info(`🚀 HireFlow ATS Backend running on http://localhost:${PORT}`);
  logger.info(`📚 Swagger Documentation available at http://localhost:${PORT}/api/docs`);
  logger.info(`🩺 Health check endpoint at http://localhost:${PORT}/api/health`);
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

import { PrismaClient } from '@prisma/client';
import { env } from './env';

export const getCanonicalDatabaseUrl = (): string => {
  const url = env.DATABASE_URL || process.env.DATABASE_URL;
  if (!url && process.env.NODE_ENV !== 'test') {
    throw new Error(
      '[HireFlow Database] DATABASE_URL is missing. Please provide a valid Neon PostgreSQL connection string in your environment.'
    );
  }
  return url || '';
};

declare global {
  // eslint-disable-next-line no-var
  var prismaClientGlobal: PrismaClient | undefined;
}

const dbUrl = getCanonicalDatabaseUrl();

export const prisma =
  globalThis.prismaClientGlobal ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl || undefined,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

// Maintain client reference across warm serverless function invocations to avoid connection exhaustion
globalThis.prismaClientGlobal = prisma;

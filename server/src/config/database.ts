import { PrismaClient } from '@prisma/client';
import path from 'path';

export const getCanonicalDatabaseUrl = (): string => {
  const currentUrl = process.env.DATABASE_URL || '';
  if (currentUrl.startsWith('postgresql://') || currentUrl.startsWith('postgres://')) {
    return currentUrl;
  }
  const absoluteDbPath = path.resolve(__dirname, '../../prisma/dev.db');
  return `file:${absoluteDbPath}`;
};

const canonicalUrl = getCanonicalDatabaseUrl();
process.env.DATABASE_URL = canonicalUrl;

declare global {
  // eslint-disable-next-line no-var
  var prismaClientGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaClientGlobal ||
  new PrismaClient({
    datasources: {
      db: {
        url: canonicalUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaClientGlobal = prisma;
}


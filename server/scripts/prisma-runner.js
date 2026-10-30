const { execSync } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const command = process.argv[2] || 'generate';
const dbUrl = process.env.DATABASE_URL || '';
const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://') || process.env.NODE_ENV === 'production';
const schema = isPostgres ? 'prisma/schema.prisma' : 'prisma/schema.sqlite.prisma';

console.log(`[Prisma Runner] Target Database: ${isPostgres ? 'PostgreSQL' : 'SQLite'} (${schema})`);

let execCommand = '';
if (command === 'generate') {
  execCommand = `npx prisma generate --schema=${schema}`;
} else if (command === 'migrate') {
  execCommand = isPostgres
    ? `npx prisma migrate deploy --schema=${schema}`
    : `npx prisma db push --schema=${schema}`;
} else if (command === 'seed') {
  execCommand = `npx ts-node src/seeds/seed.ts`;
} else {
  execCommand = `npx prisma ${command} --schema=${schema}`;
}

console.log(`[Prisma Runner] Executing: ${execCommand}`);
execSync(execCommand, { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });

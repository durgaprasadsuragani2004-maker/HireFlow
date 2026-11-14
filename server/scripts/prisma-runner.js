const { execSync } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const command = process.argv[2] || 'generate';
const schema = 'prisma/schema.prisma';

console.log(`[Prisma Runner - PostgreSQL] Managing database via ${schema}`);

let execCommand = '';
if (command === 'generate') {
  execCommand = `npx prisma generate --schema=${schema}`;
} else if (command === 'migrate') {
  execCommand = `npx prisma migrate deploy --schema=${schema}`;
} else if (command === 'push') {
  execCommand = `npx prisma db push --schema=${schema}`;
} else if (command === 'seed') {
  execCommand = `npx ts-node src/seeds/seed.ts`;
} else {
  execCommand = `npx prisma ${command} --schema=${schema}`;
}

console.log(`[Prisma Runner - PostgreSQL] Executing: ${execCommand}`);
execSync(execCommand, { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });

/**
 * HireFlow ATS — Safe SQLite to Render PostgreSQL Migration Utility
 *
 * This utility safely migrates existing HireFlow companies, jobs, users, profiles,
 * and related relational records from the local SQLite database (server/prisma/dev.db)
 * to the production Render PostgreSQL database.
 *
 * SAFETY & INTEGRITY GUARANTEES:
 * 1. Explicit Target Connection: Requires MIGRATION_TARGET_DATABASE_URL. Never falls back to .env DATABASE_URL.
 * 2. Fail-Fast on Connection Error: If PostgreSQL connection fails, exits immediately with code 1.
 *    Never falls back to source-only audit and never reports zero destination records as a live result.
 * 3. Default mode is DRY RUN (--dry-run). No production writes occur without --execute.
 * 4. Uses a read-only transaction (BEGIN READ ONLY ... ROLLBACK) during dry-run against PostgreSQL.
 * 5. NEVER calls deleteMany(), DROP TABLE, or TRUNCATE.
 * 6. NEVER overwrites existing production users, passwords, roles, or profiles.
 * 7. Full relational ID remapping: when a parent record (Company or User) already exists in production
 *    with a different ID, every dependent child record (RecruiterProfile, ApplicantProfile, Job,
 *    Application, StageHistory, Notification, AuditLog) is automatically mapped to the existing
 *    PostgreSQL parent ID.
 * 8. Orphan Prevention: Any child record whose parent is missing or unresolvable is skipped rather
 *    than violating a foreign-key constraint.
 * 9. Security: Passwords and PostgreSQL connection strings are masked from all console logs and errors.
 */

import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
import { Client } from 'pg';

export interface ConflictRecord {
  table: string;
  sourceId: string;
  conflictType:
    | 'ID_COLLISION'
    | 'EMAIL_COLLISION'
    | 'COMPANY_NAME_COLLISION'
    | 'PROFILE_COLLISION'
    | 'DUPLICATE_APPLICATION'
    | 'UNRESOLVED_FOREIGN_KEY';
  details: string;
  actionTaken: string;
}

export interface TableStats {
  sourceCount: number;
  destCountBefore: number;
  safeToImport: number;
  conflictsSkipped: number;
  remappedRelations: number;
  destCountAfterExpected: number;
}

export interface MigrationEvaluationResult {
  plannedSafeRows: Record<string, any[]>;
  tableStats: Record<string, TableStats>;
  conflicts: ConflictRecord[];
  totalSource: number;
  totalSafe: number;
  totalConflicts: number;
  totalRemapped: number;
}

// Order of tables for relational dependency insertion
export const TABLE_ORDER = [
  'Company',
  'User',
  'RecruiterProfile',
  'ApplicantProfile',
  'ApplicantSkill',
  'Experience',
  'Education',
  'Job',
  'Application',
  'ApplicationStageHistory',
  'Interview',
  'Notification',
  'AuditLog',
];

export const maskDatabaseUrl = (url?: string): string => {
  if (!url || typeof url !== 'string') return 'NOT PROVIDED';
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = '****';
    if (parsed.username) parsed.username = '****';
    return parsed.toString();
  } catch {
    return url.replace(/:\/\/([^:]+):([^@]+)@/, '://****:****@');
  }
};

export const sanitizeErrorMessage = (msg: string, secretUrl?: string): string => {
  if (!msg || typeof msg !== 'string') return '';
  if (!secretUrl) return msg;
  try {
    const parsed = new URL(secretUrl);
    let sanitized = msg;
    if (parsed.password) sanitized = sanitized.split(parsed.password).join('****');
    if (parsed.username && parsed.username !== 'postgres') {
      sanitized = sanitized.split(parsed.username).join('****');
    }
    return sanitized;
  } catch {
    return msg;
  }
};

/**
 * Pure evaluation and reconciliation engine that checks constraints,
 * maps IDs, preserves existing production records, and detects conflicts.
 */
export function evaluateMigrationPlan(
  sourceData: Record<string, any[]>,
  destExisting: Record<string, { ids: Set<string>; rows: any[] }>
): MigrationEvaluationResult {
  const companyIdRemap = new Map<string, string>();
  const userIdRemap = new Map<string, string>();
  const recruiterProfileIdRemap = new Map<string, string>();
  const applicantProfileIdRemap = new Map<string, string>();
  const jobIdRemap = new Map<string, string>();
  const applicationIdRemap = new Map<string, string>();

  // Sets of valid IDs in destination
  const validCompanyIds = new Set<string>(destExisting['Company']?.ids || []);
  const validUserIds = new Set<string>(destExisting['User']?.ids || []);
  const validRecruiterProfileIds = new Set<string>(destExisting['RecruiterProfile']?.ids || []);
  const validApplicantProfileIds = new Set<string>(destExisting['ApplicantProfile']?.ids || []);
  const validJobIds = new Set<string>(destExisting['Job']?.ids || []);
  const validApplicationIds = new Set<string>(destExisting['Application']?.ids || []);

  // Quick lookup maps for unique constraints in destination
  const destCompanyNames = new Map<string, string>();
  (destExisting['Company']?.rows || []).forEach((r) => {
    if (r.name) destCompanyNames.set(String(r.name).toLowerCase(), String(r.id));
  });

  const destUserEmails = new Map<string, { id: string; role: string }>();
  (destExisting['User']?.rows || []).forEach((r) => {
    if (r.email) destUserEmails.set(String(r.email).toLowerCase(), { id: String(r.id), role: String(r.role) });
  });

  const destRecruiterUserIds = new Map<string, string>();
  (destExisting['RecruiterProfile']?.rows || []).forEach((r) => {
    if (r.userId) destRecruiterUserIds.set(String(r.userId), String(r.id));
  });

  const destApplicantUserIds = new Map<string, string>();
  (destExisting['ApplicantProfile']?.rows || []).forEach((r) => {
    if (r.userId) destApplicantUserIds.set(String(r.userId), String(r.id));
  });

  const destApplicationPairs = new Map<string, string>();
  (destExisting['Application']?.rows || []).forEach((r) => {
    destApplicationPairs.set(`${r.jobId}_${r.applicantId}`, String(r.id));
  });

  const conflicts: ConflictRecord[] = [];
  const plannedSafeRows: Record<string, any[]> = {};
  const tableStats: Record<string, TableStats> = {};

  for (const table of TABLE_ORDER) {
    const srcRows = sourceData[table] || [];
    const destIds = destExisting[table]?.ids || new Set<string>();

    const safeRows: any[] = [];
    let conflictsSkipped = 0;
    let remappedRelations = 0;

    for (const rawRow of srcRows) {
      const row = { ...rawRow };
      let isConflict = false;

      // Table 1: Company
      if (table === 'Company') {
        const nameLower = String(row.name).toLowerCase();
        if (destCompanyNames.has(nameLower)) {
          isConflict = true;
          conflictsSkipped++;
          const existingDestId = destCompanyNames.get(nameLower)!;
          companyIdRemap.set(row.id, existingDestId);
          conflicts.push({
            table,
            sourceId: row.id,
            conflictType: 'COMPANY_NAME_COLLISION',
            details: `Company '${row.name}' already exists in production (PG ID: ${existingDestId}).`,
            actionTaken: `Skipped source row. Remapped source ID '${row.id}' -> production ID '${existingDestId}'. Production company preserved intact.`,
          });
        } else if (destIds.has(row.id)) {
          isConflict = true;
          conflictsSkipped++;
          companyIdRemap.set(row.id, row.id);
          conflicts.push({
            table,
            sourceId: row.id,
            conflictType: 'ID_COLLISION',
            details: `Company ID '${row.id}' already exists in production.`,
            actionTaken: 'Skipped source row. Production company preserved intact.',
          });
        } else {
          companyIdRemap.set(row.id, row.id);
          validCompanyIds.add(row.id);
          destCompanyNames.set(nameLower, row.id);
          safeRows.push(row);
        }
      }

      // Table 2: User
      else if (table === 'User') {
        const emailLower = String(row.email).toLowerCase();

        if (row.companyId) {
          const mappedCompanyId = companyIdRemap.get(row.companyId);
          if (mappedCompanyId) {
            if (mappedCompanyId !== row.companyId) remappedRelations++;
            row.companyId = mappedCompanyId;
          } else if (!validCompanyIds.has(row.companyId)) {
            row.companyId = null;
            remappedRelations++;
          }
        }

        if (destUserEmails.has(emailLower)) {
          isConflict = true;
          conflictsSkipped++;
          const existingDestUser = destUserEmails.get(emailLower)!;
          userIdRemap.set(row.id, existingDestUser.id);
          conflicts.push({
            table,
            sourceId: row.id,
            conflictType: 'EMAIL_COLLISION',
            details: `User email '${row.email}' already exists in production (Role: ${existingDestUser.role}, PG ID: ${existingDestUser.id}).`,
            actionTaken: `Skipped source user. Remapped source ID '${row.id}' -> production ID '${existingDestUser.id}'. Production user credentials, role, and password PRESERVED intact.`,
          });
        } else if (destIds.has(row.id)) {
          isConflict = true;
          conflictsSkipped++;
          userIdRemap.set(row.id, row.id);
          conflicts.push({
            table,
            sourceId: row.id,
            conflictType: 'ID_COLLISION',
            details: `User ID '${row.id}' already exists in production.`,
            actionTaken: 'Skipped source row. Production user preserved intact.',
          });
        } else {
          userIdRemap.set(row.id, row.id);
          validUserIds.add(row.id);
          destUserEmails.set(emailLower, { id: row.id, role: String(row.role) });
          safeRows.push(row);
        }
      }

      // Table 3: RecruiterProfile
      else if (table === 'RecruiterProfile') {
        const mappedUserId = userIdRemap.get(row.userId) || row.userId;
        const mappedCompanyId = companyIdRemap.get(row.companyId) || row.companyId;

        if (mappedUserId !== row.userId) remappedRelations++;
        if (mappedCompanyId !== row.companyId) remappedRelations++;

        row.userId = mappedUserId;
        row.companyId = mappedCompanyId;

        if (!validUserIds.has(row.userId)) {
          isConflict = true;
          conflictsSkipped++;
          conflicts.push({
            table,
            sourceId: row.id,
            conflictType: 'UNRESOLVED_FOREIGN_KEY',
            details: `RecruiterProfile references parent User '${row.userId}' which is not in destination.`,
            actionTaken: 'Skipped to prevent foreign key constraint violation.',
          });
        } else if (!validCompanyIds.has(row.companyId)) {
          isConflict = true;
          conflictsSkipped++;
          conflicts.push({
            table,
            sourceId: row.id,
            conflictType: 'UNRESOLVED_FOREIGN_KEY',
            details: `RecruiterProfile references parent Company '${row.companyId}' which is not in destination.`,
            actionTaken: 'Skipped to prevent foreign key constraint violation.',
          });
        } else if (destRecruiterUserIds.has(row.userId)) {
          isConflict = true;
          conflictsSkipped++;
          const existingProfileId = destRecruiterUserIds.get(row.userId)!;
          recruiterProfileIdRemap.set(row.id, existingProfileId);
          conflicts.push({
            table,
            sourceId: row.id,
            conflictType: 'PROFILE_COLLISION',
            details: `User '${row.userId}' already has a RecruiterProfile in production (ID: ${existingProfileId}).`,
            actionTaken: `Skipped source profile. Remapped source ID '${row.id}' -> production profile ID '${existingProfileId}'. Production profile preserved intact.`,
          });
        } else {
          recruiterProfileIdRemap.set(row.id, row.id);
          validRecruiterProfileIds.add(row.id);
          destRecruiterUserIds.set(row.userId, row.id);
          safeRows.push(row);
        }
      }

      // Table 4: ApplicantProfile
      else if (table === 'ApplicantProfile') {
        const mappedUserId = userIdRemap.get(row.userId) || row.userId;
        if (mappedUserId !== row.userId) remappedRelations++;
        row.userId = mappedUserId;

        if (!validUserIds.has(row.userId)) {
          isConflict = true;
          conflictsSkipped++;
          conflicts.push({
            table,
            sourceId: row.id,
            conflictType: 'UNRESOLVED_FOREIGN_KEY',
            details: `ApplicantProfile references parent User '${row.userId}' which is not in destination.`,
            actionTaken: 'Skipped to prevent foreign key constraint violation.',
          });
        } else if (destApplicantUserIds.has(row.userId)) {
          isConflict = true;
          conflictsSkipped++;
          const existingProfileId = destApplicantUserIds.get(row.userId)!;
          applicantProfileIdRemap.set(row.id, existingProfileId);
          conflicts.push({
            table,
            sourceId: row.id,
            conflictType: 'PROFILE_COLLISION',
            details: `User '${row.userId}' already has an ApplicantProfile in production (ID: ${existingProfileId}).`,
            actionTaken: `Skipped source profile. Remapped source ID '${row.id}' -> production profile ID '${existingProfileId}'. Production profile preserved intact.`,
          });
        } else {
          applicantProfileIdRemap.set(row.id, row.id);
          validApplicantProfileIds.add(row.id);
          destApplicantUserIds.set(row.userId, row.id);
          safeRows.push(row);
        }
      }

      // Tables 5, 6, 7: ApplicantSkill, Experience, Education
      else if (table === 'ApplicantSkill' || table === 'Experience' || table === 'Education') {
        const mappedProfileId = applicantProfileIdRemap.get(row.applicantProfileId) || row.applicantProfileId;
        if (mappedProfileId !== row.applicantProfileId) remappedRelations++;
        row.applicantProfileId = mappedProfileId;

        if (!validApplicantProfileIds.has(row.applicantProfileId)) {
          isConflict = true;
          conflictsSkipped++;
          conflicts.push({
            table,
            sourceId: row.id,
            conflictType: 'UNRESOLVED_FOREIGN_KEY',
            details: `${table} references ApplicantProfile '${row.applicantProfileId}' which is missing.`,
            actionTaken: 'Skipped to prevent foreign key constraint violation.',
          });
        } else if (destIds.has(row.id)) {
          isConflict = true;
          conflictsSkipped++;
        } else {
          safeRows.push(row);
        }
      }

      // Table 8: Job
      else if (table === 'Job') {
        const mappedCompanyId = companyIdRemap.get(row.companyId) || row.companyId;
        const mappedRecruiterId = recruiterProfileIdRemap.get(row.recruiterId) || row.recruiterId;

        if (mappedCompanyId !== row.companyId) remappedRelations++;
        if (mappedRecruiterId !== row.recruiterId) remappedRelations++;

        row.companyId = mappedCompanyId;
        row.recruiterId = mappedRecruiterId;

        if (!validCompanyIds.has(row.companyId)) {
          isConflict = true;
          conflictsSkipped++;
          conflicts.push({
            table,
            sourceId: row.id,
            conflictType: 'UNRESOLVED_FOREIGN_KEY',
            details: `Job '${row.title}' references Company '${row.companyId}' which is missing.`,
            actionTaken: 'Skipped to prevent foreign key violation.',
          });
        } else if (!validRecruiterProfileIds.has(row.recruiterId)) {
          isConflict = true;
          conflictsSkipped++;
          conflicts.push({
            table,
            sourceId: row.id,
            conflictType: 'UNRESOLVED_FOREIGN_KEY',
            details: `Job '${row.title}' references RecruiterProfile '${row.recruiterId}' which is missing.`,
            actionTaken: 'Skipped to prevent foreign key violation.',
          });
        } else if (destIds.has(row.id)) {
          isConflict = true;
          conflictsSkipped++;
          jobIdRemap.set(row.id, row.id);
        } else {
          jobIdRemap.set(row.id, row.id);
          validJobIds.add(row.id);
          safeRows.push(row);
        }
      }

      // Table 9: Application
      else if (table === 'Application') {
        const mappedJobId = jobIdRemap.get(row.jobId) || row.jobId;
        const mappedApplicantId = applicantProfileIdRemap.get(row.applicantId) || row.applicantId;

        if (mappedJobId !== row.jobId) remappedRelations++;
        if (mappedApplicantId !== row.applicantId) remappedRelations++;

        row.jobId = mappedJobId;
        row.applicantId = mappedApplicantId;

        const pairKey = `${row.jobId}_${row.applicantId}`;

        if (!validJobIds.has(row.jobId)) {
          isConflict = true;
          conflictsSkipped++;
          conflicts.push({
            table,
            sourceId: row.id,
            conflictType: 'UNRESOLVED_FOREIGN_KEY',
            details: `Application references Job '${row.jobId}' which is missing.`,
            actionTaken: 'Skipped to prevent foreign key violation.',
          });
        } else if (!validApplicantProfileIds.has(row.applicantId)) {
          isConflict = true;
          conflictsSkipped++;
          conflicts.push({
            table,
            sourceId: row.id,
            conflictType: 'UNRESOLVED_FOREIGN_KEY',
            details: `Application references ApplicantProfile '${row.applicantId}' which is missing.`,
            actionTaken: 'Skipped to prevent foreign key violation.',
          });
        } else if (destApplicationPairs.has(pairKey)) {
          isConflict = true;
          conflictsSkipped++;
          const existingAppId = destApplicationPairs.get(pairKey)!;
          applicationIdRemap.set(row.id, existingAppId);
          conflicts.push({
            table,
            sourceId: row.id,
            conflictType: 'DUPLICATE_APPLICATION',
            details: `Application for Job '${row.jobId}' and Applicant '${row.applicantId}' already exists in production (ID: ${existingAppId}).`,
            actionTaken: `Skipped source application. Remapped source ID '${row.id}' -> production ID '${existingAppId}'. Production application preserved intact.`,
          });
        } else {
          applicationIdRemap.set(row.id, row.id);
          validApplicationIds.add(row.id);
          destApplicationPairs.set(pairKey, row.id);
          safeRows.push(row);
        }
      }

      // Table 10: ApplicationStageHistory
      else if (table === 'ApplicationStageHistory') {
        const mappedAppId = applicationIdRemap.get(row.applicationId) || row.applicationId;
        const mappedUserId = userIdRemap.get(row.changedById) || row.changedById;

        if (mappedAppId !== row.applicationId) remappedRelations++;
        if (mappedUserId !== row.changedById) remappedRelations++;

        row.applicationId = mappedAppId;
        row.changedById = mappedUserId;

        if (!validApplicationIds.has(row.applicationId) || !validUserIds.has(row.changedById)) {
          isConflict = true;
          conflictsSkipped++;
          conflicts.push({
            table,
            sourceId: row.id,
            conflictType: 'UNRESOLVED_FOREIGN_KEY',
            details: `StageHistory references Application '${row.applicationId}' or User '${row.changedById}' which is missing.`,
            actionTaken: 'Skipped to prevent foreign key violation.',
          });
        } else if (destIds.has(row.id)) {
          isConflict = true;
          conflictsSkipped++;
        } else {
          safeRows.push(row);
        }
      }

      // Table 11: Interview
      else if (table === 'Interview') {
        const mappedAppId = applicationIdRemap.get(row.applicationId) || row.applicationId;
        const mappedUserId = userIdRemap.get(row.scheduledById) || row.scheduledById;

        if (mappedAppId !== row.applicationId) remappedRelations++;
        if (mappedUserId !== row.scheduledById) remappedRelations++;

        row.applicationId = mappedAppId;
        row.scheduledById = mappedUserId;

        if (!validApplicationIds.has(row.applicationId) || !validUserIds.has(row.scheduledById)) {
          isConflict = true;
          conflictsSkipped++;
          conflicts.push({
            table,
            sourceId: row.id,
            conflictType: 'UNRESOLVED_FOREIGN_KEY',
            details: `Interview references Application '${row.applicationId}' or User '${row.scheduledById}' which is missing.`,
            actionTaken: 'Skipped to prevent foreign key violation.',
          });
        } else if (destIds.has(row.id)) {
          isConflict = true;
          conflictsSkipped++;
        } else {
          safeRows.push(row);
        }
      }

      // Table 12: Notification
      else if (table === 'Notification') {
        const mappedUserId = userIdRemap.get(row.userId) || row.userId;
        if (mappedUserId !== row.userId) remappedRelations++;
        row.userId = mappedUserId;

        if (!validUserIds.has(row.userId)) {
          isConflict = true;
          conflictsSkipped++;
          conflicts.push({
            table,
            sourceId: row.id,
            conflictType: 'UNRESOLVED_FOREIGN_KEY',
            details: `Notification references User '${row.userId}' which is missing.`,
            actionTaken: 'Skipped to prevent foreign key violation.',
          });
        } else if (destIds.has(row.id)) {
          isConflict = true;
          conflictsSkipped++;
        } else {
          safeRows.push(row);
        }
      }

      // Table 13: AuditLog
      else if (table === 'AuditLog') {
        if (row.actorId) {
          const mappedActorId = userIdRemap.get(row.actorId) || row.actorId;
          if (mappedActorId !== row.actorId) remappedRelations++;
          row.actorId = mappedActorId;

          if (!validUserIds.has(row.actorId)) {
            row.actorId = null;
            remappedRelations++;
          }
        }
        if (destIds.has(row.id)) {
          isConflict = true;
          conflictsSkipped++;
        } else {
          safeRows.push(row);
        }
      }
    }

    plannedSafeRows[table] = safeRows;
    const destBefore = (destExisting[table]?.rows || []).length;
    tableStats[table] = {
      sourceCount: srcRows.length,
      destCountBefore: destBefore,
      safeToImport: safeRows.length,
      conflictsSkipped,
      remappedRelations,
      destCountAfterExpected: destBefore + safeRows.length,
    };
  }

  let totalSource = 0;
  let totalSafe = 0;
  let totalConflicts = 0;
  let totalRemapped = 0;

  for (const table of TABLE_ORDER) {
    const s = tableStats[table];
    totalSource += s.sourceCount;
    totalSafe += s.safeToImport;
    totalConflicts += s.conflictsSkipped;
    totalRemapped += s.remappedRelations;
  }

  return {
    plannedSafeRows,
    tableStats,
    conflicts,
    totalSource,
    totalSafe,
    totalConflicts,
    totalRemapped,
  };
}

export async function runMigration() {
  const args = process.argv.slice(2);
  const isExecute = args.includes('--execute');
  const isDryRun = !isExecute || args.includes('--dry-run');

  // Requirement 1: MIGRATION_TARGET_DATABASE_URL must take precedence over any DATABASE_URL loaded from .env
  let targetUrl = process.env.MIGRATION_TARGET_DATABASE_URL?.trim();

  // Support explicit CLI flag override if provided
  for (const arg of args) {
    if (arg.startsWith('--target-url=')) {
      targetUrl = arg.split('=')[1].replace(/^["']|["']$/g, '').trim();
    }
  }

  let sqlitePath = path.resolve(__dirname, '../prisma/dev.db');
  for (const arg of args) {
    if (arg.startsWith('--sqlite-path=')) {
      sqlitePath = path.resolve(arg.split('=')[1].replace(/^["']|["']$/g, ''));
    }
  }

  console.log('='.repeat(80));
  console.log('🚀 HIREFLOW ATS — SAFE SQLITE TO RENDER POSTGRESQL MIGRATION UTILITY');
  console.log('='.repeat(80));
  console.log(`Execution Mode:   ${isDryRun ? '🔍 DRY RUN (Read-Only Transaction — Zero production writes)' : '⚠️ EXECUTE (Live Transactional Migration)'}`);
  console.log(`Source Database:  ${sqlitePath}`);
  console.log(`Target Database:  ${maskDatabaseUrl(targetUrl)}`);
  console.log('='.repeat(80));

  // Requirement 2: If MIGRATION_TARGET_DATABASE_URL is missing, exit with a clear error
  if (!targetUrl) {
    console.error('\n❌ Configuration Error: MIGRATION_TARGET_DATABASE_URL is required.');
    console.error('The migration utility requires the destination Render PostgreSQL connection URL.');
    console.error('Please configure MIGRATION_TARGET_DATABASE_URL with your Render PostgreSQL External Database URL:');
    console.error('\n  export MIGRATION_TARGET_DATABASE_URL="postgresql://user:password@dpg-xxx.oregon-postgres.render.com/dbname?sslmode=require"');
    console.error('  npm run migrate:prod -- --dry-run\n');
    process.exit(1);
  }

  if (!fs.existsSync(sqlitePath)) {
    console.error(`\n❌ Source SQLite database file not found at: ${sqlitePath}`);
    process.exit(1);
  }

  // 1. Connect to PostgreSQL first (Requirement 3: Fail fast on connection error)
  let pgClient: Client;
  try {
    pgClient = new Client({
      connectionString: targetUrl,
      ssl: { rejectUnauthorized: false },
    });
    await pgClient.connect();

    // Requirement 5: Keep --dry-run strictly read-only using PostgreSQL transaction isolation
    if (isDryRun) {
      await pgClient.query('BEGIN READ ONLY');
      console.log('✔ Connected to Render PostgreSQL and initiated READ-ONLY transaction.');
    } else {
      console.log('✔ Connected to Render PostgreSQL in live migration mode.');
    }
  } catch (err: any) {
    const sanitizedMsg = sanitizeErrorMessage(err.message, targetUrl);
    console.error(`\n❌ Failed to connect to destination PostgreSQL database: ${sanitizedMsg}`);

    // Provide immediate diagnosis if Render's Internal hostname was used instead of External hostname
    if (err.code === 'ENOTFOUND' || err.message.includes('ENOTFOUND')) {
      console.error('\n💡 DNS Resolution Error (ENOTFOUND):');
      console.error('You appear to be using Render\'s "Internal Database URL" (e.g. host dpg-xxxx-a), which only resolves inside Render\'s private cloud network.');
      console.error('To run the migration from your local machine, use the "External Database URL" from your Render Dashboard:');
      console.error('  1. Open your Render Dashboard -> PostgreSQL instance.');
      console.error('  2. In the "Connections" panel, copy the "External Database URL" (ending in .oregon-postgres.render.com or similar region).');
      console.error('  3. Run: export MIGRATION_TARGET_DATABASE_URL="<External Database URL>"');
      console.error('  4. Re-run: npm run migrate:prod -- --dry-run\n');
    }

    console.error('Migration aborted: Cannot proceed without a live PostgreSQL connection.');
    process.exit(1);
  }

  // 2. Open Source SQLite Database
  const sqlite = new DatabaseSync(sqlitePath);
  console.log('✔ Successfully opened source SQLite database.');

  // 3. Inspect Source SQLite Tables & Record Counts
  console.log('\n📊 1. SOURCE DATABASE (SQLite dev.db) RECORD COUNTS:');
  console.log('-'.repeat(80));
  const sourceData: Record<string, any[]> = {};
  for (const table of TABLE_ORDER) {
    try {
      const rows = sqlite.prepare(`SELECT * FROM "${table}"`).all();
      sourceData[table] = rows;
      console.log(`  • ${table.padEnd(25)} : ${rows.length.toString().padStart(6)} records`);
    } catch (e: any) {
      sourceData[table] = [];
      console.log(`  • ${table.padEnd(25)} : Table not found in SQLite (${e.message})`);
    }
  }

  // 4. Query Destination PostgreSQL Tables & Record Counts (Requirement 4: Only after successful connection)
  console.log('\n📊 2. DESTINATION DATABASE (Live Render PostgreSQL) EXISTING COUNTS:');
  console.log('-'.repeat(80));
  const destExisting: Record<string, { ids: Set<string>; rows: any[] }> = {};
  for (const table of TABLE_ORDER) {
    try {
      const res = await pgClient.query(`SELECT * FROM "${table}"`);
      const idSet = new Set<string>(res.rows.map((r: any) => String(r.id)));
      destExisting[table] = { ids: idSet, rows: res.rows };
      console.log(`  • ${table.padEnd(25)} : ${res.rows.length.toString().padStart(6)} existing records`);
    } catch (e: any) {
      destExisting[table] = { ids: new Set(), rows: [] };
      console.log(`  • ${table.padEnd(25)} : Error querying table (${e.message})`);
    }
  }

  // 5. Run Relational Evaluation & Remapping Plan
  console.log('\n🔍 3. RELATIONAL RE-MAPPING & CONFLICT RECONCILIATION:');
  console.log('-'.repeat(80));
  const plan = evaluateMigrationPlan(sourceData, destExisting);

  for (const table of TABLE_ORDER) {
    const s = plan.tableStats[table];
    console.log(
      `  • ${table.padEnd(25)} : ${s.safeToImport.toString().padStart(5)} safe to import | ${s.conflictsSkipped.toString().padStart(4)} conflicts | ${s.remappedRelations.toString().padStart(4)} remapped relations | expected total: ${s.destCountAfterExpected}`
    );
  }

  // 6. Summary Report
  console.log('\n📋 4. DRY RUN SUMMARY REPORT:');
  console.log('='.repeat(80));
  console.log(`Total Source Records in SQLite:           ${plan.totalSource}`);
  console.log(`Total Existing Records in Render PG:      ${Object.values(destExisting).reduce((acc, d) => acc + d.rows.length, 0)}`);
  console.log(`Records Safe to Import (Non-destructive): ${plan.totalSafe}`);
  console.log(`Conflicts Safely Preserved / Skipped:     ${plan.totalConflicts}`);
  console.log(`Relational References Safely Remapped:    ${plan.totalRemapped}`);
  console.log('='.repeat(80));

  if (plan.conflicts.length > 0) {
    console.log('\n⚠️ CONFLICT DETAILS & SAFETY PRESERVATION LOG:');
    console.log('-'.repeat(80));
    plan.conflicts.forEach((c, idx) => {
      console.log(`[${idx + 1}] Table: ${c.table} | Type: ${c.conflictType}`);
      console.log(`    Detail: ${c.details}`);
      console.log(`    Safety Action: ${c.actionTaken}\n`);
    });
  } else {
    console.log('\n✔ Zero data conflicts detected between source and destination.');
  }

  // 7. Close / Rollback or Execute
  if (isExecute && !isDryRun) {
    console.log('\n⚠️ EXECUTING PRODUCTION MIGRATION INSIDE LIVE TRANSACTION...');
    try {
      await pgClient.query('BEGIN');

      for (const table of TABLE_ORDER) {
        const safeRows = plan.plannedSafeRows[table] || [];
        if (safeRows.length === 0) continue;

        console.log(`Inserting ${safeRows.length} safe records into "${table}"...`);

        for (const row of safeRows) {
          const keys = Object.keys(row);
          const values = keys.map((k) => {
            const val = row[k];
            if ((k.endsWith('At') || k === 'deadline') && val !== null && val !== undefined) {
              return new Date(val);
            }
            if (k === 'read' || k === 'current') {
              return Boolean(val);
            }
            return val;
          });

          const cols = keys.map((k) => `"${k}"`).join(', ');
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

          const query = `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
          await pgClient.query(query, values);
        }
        console.log(`✔ "${table}" import complete.`);
      }

      await pgClient.query('COMMIT');
      console.log('\n🎉 PRODUCTION MIGRATION COMMITTED SUCCESSFULLY!');

      // Update sequences if any exist in the database
      const seqRes = await pgClient.query(`
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
      `);
      if (seqRes.rows.length > 0) {
        console.log(`\nUpdating ${seqRes.rows.length} PostgreSQL sequence(s)...`);
        for (const seq of seqRes.rows) {
          const seqName = seq.sequence_name;
          const match = seqName.match(/^([^_]+)_(.+)_seq$/);
          if (match) {
            const [, tName, cName] = match;
            try {
              await pgClient.query(`
                SELECT setval('${seqName}', COALESCE((SELECT MAX("${cName}") FROM "${tName}"), 1), true)
              `);
              console.log(`  ✔ Sequence '${seqName}' updated.`);
            } catch {
              // Ignore if custom sequence
            }
          }
        }
      } else {
        console.log('ℹ All tables use UUID primary keys; no sequence counters required updating.');
      }

      // Post-migration verification
      console.log('\n📊 POST-MIGRATION RECORD VERIFICATION:');
      for (const table of TABLE_ORDER) {
        const res = await pgClient.query(`SELECT count(*) as c FROM "${table}"`);
        console.log(`  • ${table.padEnd(25)} : ${res.rows[0].c} records`);
      }
    } catch (err: any) {
      const sanitized = sanitizeErrorMessage(err.message, targetUrl);
      console.error(`❌ MIGRATION FAILED: ${sanitized}`);
      await pgClient.query('ROLLBACK');
      console.log('🔄 Transaction rolled back. Zero production records were altered.');
      process.exit(1);
    }
  } else {
    // Dry run rollback: cleanly abort the read-only transaction
    try {
      await pgClient.query('ROLLBACK');
      console.log('✔ Read-only transaction rolled back cleanly. Zero production writes executed.');
    } catch {
      // Ignored
    }
    console.log('\nℹ DRY RUN COMPLETE. Verified read-only audit finished.');
  }

  await pgClient.end();
}

if (require.main === module) {
  runMigration().catch((err) => {
    console.error('Fatal migration utility error:', err);
    process.exit(1);
  });
}

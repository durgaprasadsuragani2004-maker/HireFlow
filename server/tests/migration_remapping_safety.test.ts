import {
  maskDatabaseUrl,
  sanitizeErrorMessage,
  evaluateMigrationPlan,
} from '../scripts/migrate-sqlite-to-postgres';

describe('Migration Utility Safety & Remapping Verification', () => {
  describe('1. Security & URL Sanitization', () => {
    it('should mask sensitive passwords in PostgreSQL URLs', () => {
      const sensitiveUrl = 'postgresql://hireflow_admin:SuperSecretPass123!@dpg-abc12345.oregon-postgres.render.com/hireflow_prod';
      const masked = maskDatabaseUrl(sensitiveUrl);

      expect(masked).not.toContain('SuperSecretPass123!');
      expect(masked).toContain('****');
      expect(masked).toContain('dpg-abc12345.oregon-postgres.render.com');
    });

    it('should sanitize passwords from error messages', () => {
      const sensitiveUrl = 'postgresql://postgres:MySecretPassword999@host.com/db';
      const rawError = 'Error: connect failed with password MySecretPassword999 at host.com';
      const sanitized = sanitizeErrorMessage(rawError, sensitiveUrl);

      expect(sanitized).not.toContain('MySecretPassword999');
      expect(sanitized).toContain('****');
    });

    it('should return NOT PROVIDED for empty or undefined URLs', () => {
      expect(maskDatabaseUrl(undefined)).toBe('NOT PROVIDED');
      expect(maskDatabaseUrl('')).toBe('NOT PROVIDED');
    });
  });

  describe('2. evaluateMigrationPlan Engine & Remapping Safety', () => {
    it('should safely remap child relations when parent user and company conflict with existing production records', () => {
      // Mock existing production destination with existing user and company
      const destExisting: Record<string, { ids: Set<string>; rows: any[] }> = {
        Company: {
          ids: new Set(['prod-company-uuid-1']),
          rows: [{ id: 'prod-company-uuid-1', name: 'TechNova Solutions' }],
        },
        User: {
          ids: new Set(['prod-user-uuid-1']),
          rows: [{ id: 'prod-user-uuid-1', email: 'sarah.recruiter@technova.com', role: 'RECRUITER' }],
        },
        RecruiterProfile: {
          ids: new Set(['prod-recruiter-uuid-1']),
          rows: [{ id: 'prod-recruiter-uuid-1', userId: 'prod-user-uuid-1', companyId: 'prod-company-uuid-1' }],
        },
        ApplicantProfile: { ids: new Set(), rows: [] },
        ApplicantSkill: { ids: new Set(), rows: [] },
        Experience: { ids: new Set(), rows: [] },
        Education: { ids: new Set(), rows: [] },
        Job: { ids: new Set(), rows: [] },
        Application: { ids: new Set(), rows: [] },
        ApplicationStageHistory: { ids: new Set(), rows: [] },
        Interview: { ids: new Set(), rows: [] },
        Notification: { ids: new Set(), rows: [] },
        AuditLog: { ids: new Set(), rows: [] },
      };

      // Mock source data from SQLite with duplicate user email and duplicate company name, but new jobs and logs
      const sourceData: Record<string, any[]> = {
        Company: [
          { id: 'sqlite-comp-1', name: 'TechNova Solutions', description: 'Source Company' },
          { id: 'sqlite-comp-2', name: 'Acme Corp', description: 'Brand New Company' },
        ],
        User: [
          { id: 'sqlite-user-1', email: 'sarah.recruiter@technova.com', role: 'RECRUITER', passwordHash: 'sqlite-secret' },
          { id: 'sqlite-user-2', email: 'john.new@acme.com', role: 'RECRUITER', passwordHash: 'sqlite-secret-2', companyId: 'sqlite-comp-2' },
        ],
        RecruiterProfile: [
          { id: 'sqlite-rp-1', userId: 'sqlite-user-1', companyId: 'sqlite-comp-1', title: 'Senior Recruiter' },
          { id: 'sqlite-rp-2', userId: 'sqlite-user-2', companyId: 'sqlite-comp-2', title: 'Talent Acquisition' },
        ],
        ApplicantProfile: [],
        ApplicantSkill: [],
        Experience: [],
        Education: [],
        Job: [
          // Job created by sqlite-user-1 in sqlite-comp-1 -> should be remapped to prod-company-uuid-1 and prod-recruiter-uuid-1
          { id: 'sqlite-job-1', companyId: 'sqlite-comp-1', recruiterId: 'sqlite-rp-1', title: 'Principal Architect' },
          { id: 'sqlite-job-2', companyId: 'sqlite-comp-2', recruiterId: 'sqlite-rp-2', title: 'Frontend Engineer' },
        ],
        Application: [],
        ApplicationStageHistory: [],
        Interview: [],
        Notification: [
          { id: 'sqlite-notif-1', userId: 'sqlite-user-1', title: 'Welcome', message: 'Hello' },
        ],
        AuditLog: [
          { id: 'sqlite-audit-1', actorId: 'sqlite-user-1', action: 'USER_LOGIN' },
        ],
      };

      const result = evaluateMigrationPlan(sourceData, destExisting);

      // Verify that the existing company was skipped and remapped
      expect(result.tableStats['Company'].safeToImport).toBe(1); // Only Acme Corp
      expect(result.tableStats['Company'].conflictsSkipped).toBe(1); // TechNova skipped
      expect(result.conflicts.some((c) => c.conflictType === 'COMPANY_NAME_COLLISION')).toBe(true);

      // Verify that existing user was skipped and production credentials preserved
      expect(result.tableStats['User'].safeToImport).toBe(1); // Only john.new@acme.com
      expect(result.tableStats['User'].conflictsSkipped).toBe(1); // sarah skipped
      expect(result.conflicts.some((c) => c.conflictType === 'EMAIL_COLLISION')).toBe(true);
      expect(result.plannedSafeRows['User'].some((u) => u.email === 'sarah.recruiter@technova.com')).toBe(false);

      // Verify that existing recruiter profile was skipped and production profile preserved
      expect(result.tableStats['RecruiterProfile'].safeToImport).toBe(1); // Only sqlite-rp-2
      expect(result.tableStats['RecruiterProfile'].conflictsSkipped).toBe(1);

      // Verify that Job 1 was remapped to production IDs
      const remappedJob1 = result.plannedSafeRows['Job'].find((j) => j.id === 'sqlite-job-1');
      expect(remappedJob1).toBeDefined();
      expect(remappedJob1.companyId).toBe('prod-company-uuid-1');
      expect(remappedJob1.recruiterId).toBe('prod-recruiter-uuid-1');

      // Verify that Notification and AuditLog were remapped to production User ID
      const remappedNotif = result.plannedSafeRows['Notification'].find((n) => n.id === 'sqlite-notif-1');
      expect(remappedNotif.userId).toBe('prod-user-uuid-1');

      const remappedAudit = result.plannedSafeRows['AuditLog'].find((a) => a.id === 'sqlite-audit-1');
      expect(remappedAudit.actorId).toBe('prod-user-uuid-1');

      expect(result.totalRemapped).toBeGreaterThan(0);
    });

    it('should prevent invalid foreign keys when a child record references a missing parent', () => {
      const destExisting: Record<string, { ids: Set<string>; rows: any[] }> = {
        Company: { ids: new Set(), rows: [] },
        User: { ids: new Set(), rows: [] },
        RecruiterProfile: { ids: new Set(), rows: [] },
        ApplicantProfile: { ids: new Set(), rows: [] },
        ApplicantSkill: { ids: new Set(), rows: [] },
        Experience: { ids: new Set(), rows: [] },
        Education: { ids: new Set(), rows: [] },
        Job: { ids: new Set(), rows: [] },
        Application: { ids: new Set(), rows: [] },
        ApplicationStageHistory: { ids: new Set(), rows: [] },
        Interview: { ids: new Set(), rows: [] },
        Notification: { ids: new Set(), rows: [] },
        AuditLog: { ids: new Set(), rows: [] },
      };

      const sourceData: Record<string, any[]> = {
        Company: [],
        User: [],
        RecruiterProfile: [],
        ApplicantProfile: [],
        ApplicantSkill: [
          // References non-existent applicant profile
          { id: 'skill-1', applicantProfileId: 'missing-applicant-profile-uuid', name: 'TypeScript' },
        ],
        Experience: [],
        Education: [],
        Job: [],
        Application: [],
        ApplicationStageHistory: [],
        Interview: [],
        Notification: [],
        AuditLog: [],
      };

      const result = evaluateMigrationPlan(sourceData, destExisting);

      expect(result.tableStats['ApplicantSkill'].safeToImport).toBe(0);
      expect(result.tableStats['ApplicantSkill'].conflictsSkipped).toBe(1);
      expect(result.conflicts.some((c) => c.conflictType === 'UNRESOLVED_FOREIGN_KEY')).toBe(true);
    });
  });
});

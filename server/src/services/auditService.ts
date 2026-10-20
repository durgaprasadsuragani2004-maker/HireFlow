import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export class AuditService {
  async log(data: {
    actorId?: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    metadata?: Record<string, any>;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    try {
      return await prisma.auditLog.create({
        data: {
          actorId: data.actorId || null,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId || null,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
        },
      });
    } catch (err) {
      logger.error('Failed to write audit log:', err);
      return null;
    }
  }

  async getLogs(params: {
    page?: number;
    limit?: number;
    entity?: string;
    action?: string;
    actorId?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.entity) where.entity = params.entity;
    if (params.action) where.action = params.action;
    if (params.actorId) where.actorId = params.actorId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => ({
        ...log,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
      })),
      total,
      page,
      limit,
    };
  }
}

export const auditService = new AuditService();

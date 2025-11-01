import { prisma } from '../db/prisma';

// Re-export request utilities for backwards compatibility
export { getUserInfoFromRequest } from '../utils/request';

/**
 * Audit Log Entry Types
 */
export type AuditAction =
  // Authentication
  | 'auth.login.success'
  | 'auth.login.failed'
  | 'auth.logout'
  // User Management
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.password_changed'
  // DNS Operations
  | 'dns.record.created'
  | 'dns.record.updated'
  | 'dns.record.deleted'
  | 'dns.zone.added'
  | 'dns.zone.removed'
  // Watcher Operations
  | 'watcher.created'
  | 'watcher.updated'
  | 'watcher.deleted'
  | 'watcher.toggled'
  | 'watcher.check.triggered'
  | 'watcher.settings.updated'
  // Notification Operations
  | 'notifications.settings.updated'
  // Cache Operations
  | 'cache.config.updated'
  | 'cache.cleared'
  // System Operations
  | 'system.settings.updated'
  | 'system.security.csrf_blocked'
  | 'system.security.rate_limited';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditLogEntry {
  id: string;
  timestamp: string | Date;
  action: AuditAction;
  severity: AuditSeverity;
  userId?: string;
  userEmail?: string;
  userName?: string;
  ip?: string;
  userAgent?: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  success: boolean;
  error?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: {
  action: AuditAction;
  severity?: AuditSeverity;
  userId?: string;
  userEmail?: string;
  userName?: string;
  ip?: string;
  userAgent?: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  success: boolean;
  error?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        severity: params.severity || 'info',
        userId: params.userId || null,
        ip: params.ip || null,
        userAgent: params.userAgent || null,
        resource: params.resource || null,
        resourceId: params.resourceId || null,
        details: params.details || undefined,
        success: params.success,
      },
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
}

/**
 * Query audit logs with filters
 */
export async function queryAuditLogs(params?: {
  userId?: string;
  action?: AuditAction;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
  keyword?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: AuditLogEntry[]; total: number }> {
  try {
    // Build where clause
    const where: any = {};

    if (params?.userId) {
      where.userId = params.userId;
    }
    if (params?.action) {
      where.action = params.action;
    }
    if (params?.severity) {
      where.severity = params.severity;
    }
    if (params?.startDate || params?.endDate) {
      where.timestamp = {};
      if (params.startDate) {
        where.timestamp.gte = params.startDate;
      }
      if (params.endDate) {
        where.timestamp.lte = params.endDate;
      }
    }

    // Keyword search across multiple fields
    if (params?.keyword) {
      const keyword = params.keyword;
      where.OR = [
        { action: { contains: keyword, mode: 'insensitive' } },
        { resource: { contains: keyword, mode: 'insensitive' } },
        { resourceId: { contains: keyword, mode: 'insensitive' } },
        { ip: { contains: keyword, mode: 'insensitive' } },
        { userAgent: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.auditLog.count({ where });

    // Get paginated logs with user information
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip: params?.offset || 0,
      take: params?.limit || 100,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Map logs to include userName and status
    const enrichedLogs = logs.map((log) => ({
      ...log,
      userName: log.user?.name || log.user?.email || 'Unknown',
      status: log.success ? 'success' : 'failure',
    }));

    return {
      logs: enrichedLogs as any[],
      total,
    };
  } catch (error) {
    console.error('Error querying audit logs:', error);
    return { logs: [], total: 0 };
  }
}

/**
 * Clear old audit logs (for maintenance)
 * Only keeps logs from the last N days
 */
export async function pruneOldAuditLogs(daysToKeep: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  } catch (error) {
    console.error('Error pruning audit logs:', error);
    return 0;
  }
}

import { NextRequest } from 'next/server';
import { createAuditLog, getUserInfoFromRequest } from '@/lib/audit/logger';

/**
 * DNS operation types
 */
export type DNSOperation = 'created' | 'updated' | 'deleted';

/**
 * User information from authenticated request
 */
export interface RequestUser {
  userId: string;
  email: string;
  name: string;
  role: string; // 'admin' or 'user'
}

/**
 * DNS record data for audit logging
 */
export interface DNSRecordAuditData {
  zoneName: string;
  recordType?: string;
  recordName?: string;
  content?: string;
  ttl?: number;
  proxied?: boolean;
  oldContent?: string;
  cfErrors?: any[];
}

/**
 * Log a DNS operation (create, update, delete)
 *
 * @param operation - The operation type (created, updated, deleted)
 * @param request - The Next.js request object
 * @param user - The authenticated user
 * @param recordId - The DNS record ID
 * @param data - DNS record data for the audit log
 * @param success - Whether the operation was successful
 * @param error - Optional error message
 *
 * @example
 * ```typescript
 * await logDNSOperation(
 *   'updated',
 *   request,
 *   user,
 *   recordId,
 *   { zoneName: 'example.com', recordType: 'A', recordName: 'www', content: '1.2.3.4' },
 *   true
 * );
 * ```
 */
export async function logDNSOperation(
  operation: DNSOperation,
  request: NextRequest,
  user: RequestUser,
  recordId: string,
  data: DNSRecordAuditData,
  success: boolean,
  error?: string
): Promise<void> {
  const action = `dns.record.${operation}`;
  const severity = success ? 'info' : 'warning';

  const auditData: any = {
    action,
    severity,
    ...getUserInfoFromRequest(request, user),
    resource: 'dns_record',
    resourceId: recordId,
    details: {
      zoneName: data.zoneName,
      ...(data.recordType && { recordType: data.recordType }),
      ...(data.recordName && { recordName: data.recordName }),
      ...(data.content && { content: data.content }),
      ...(data.ttl && { ttl: data.ttl }),
      ...(data.proxied !== undefined && { proxied: data.proxied }),
      ...(data.oldContent && { oldContent: data.oldContent }),
      ...(data.cfErrors && { cfErrors: data.cfErrors }),
    },
    success,
  };

  if (error) {
    auditData.error = error;
  }

  await createAuditLog(auditData);
}

/**
 * Log a zone operation (create, update, delete)
 *
 * @param operation - The operation type
 * @param request - The Next.js request object
 * @param user - The authenticated user
 * @param zoneName - The zone name
 * @param zoneId - The zone ID
 * @param success - Whether the operation was successful
 * @param error - Optional error message
 * @param details - Optional additional details
 *
 * @example
 * ```typescript
 * await logZoneOperation(
 *   'created',
 *   request,
 *   user,
 *   'example.com',
 *   'zone123',
 *   true
 * );
 * ```
 */
export async function logZoneOperation(
  operation: string,
  request: NextRequest,
  user: RequestUser,
  zoneName: string,
  zoneId: string,
  success: boolean,
  error?: string,
  details?: Record<string, any>
): Promise<void> {
  const action = `zone.${operation}`;
  const severity = success ? 'info' : 'warning';

  const auditData: any = {
    action,
    severity,
    ...getUserInfoFromRequest(request, user),
    resource: 'zone',
    resourceId: zoneId,
    details: {
      zoneName,
      ...details,
    },
    success,
  };

  if (error) {
    auditData.error = error;
  }

  await createAuditLog(auditData);
}

/**
 * Log a watcher operation (create, update, delete, check)
 *
 * @param operation - The operation type
 * @param request - The Next.js request object
 * @param user - The authenticated user
 * @param watcherId - The watcher ID
 * @param data - Watcher data
 * @param success - Whether the operation was successful
 * @param error - Optional error message
 *
 * @example
 * ```typescript
 * await logWatcherOperation(
 *   'created',
 *   request,
 *   user,
 *   watcherId,
 *   { zoneName: 'example.com', recordName: 'www', recordType: 'A' },
 *   true
 * );
 * ```
 */
export async function logWatcherOperation(
  operation: string,
  request: NextRequest,
  user: RequestUser,
  watcherId: string,
  data: Record<string, any>,
  success: boolean,
  error?: string
): Promise<void> {
  const action = `watcher.${operation}`;
  const severity = success ? 'info' : 'warning';

  const auditData: any = {
    action,
    severity,
    ...getUserInfoFromRequest(request, user),
    resource: 'watcher',
    resourceId: watcherId,
    details: data,
    success,
  };

  if (error) {
    auditData.error = error;
  }

  await createAuditLog(auditData);
}

/**
 * Log a user operation (create, update, delete, login, logout)
 *
 * @param operation - The operation type
 * @param request - The Next.js request object
 * @param user - The authenticated user (or user being operated on)
 * @param userId - The user ID
 * @param success - Whether the operation was successful
 * @param error - Optional error message
 * @param details - Optional additional details
 *
 * @example
 * ```typescript
 * await logUserOperation(
 *   'login',
 *   request,
 *   user,
 *   userId,
 *   true
 * );
 * ```
 */
export async function logUserOperation(
  operation: string,
  request: NextRequest,
  user: RequestUser,
  userId: string,
  success: boolean,
  error?: string,
  details?: Record<string, any>
): Promise<void> {
  const action = `user.${operation}`;
  const severity = success ? 'info' : 'warning';

  const auditData: any = {
    action,
    severity,
    ...getUserInfoFromRequest(request, user),
    resource: 'user',
    resourceId: userId,
    details: details || {},
    success,
  };

  if (error) {
    auditData.error = error;
  }

  await createAuditLog(auditData);
}

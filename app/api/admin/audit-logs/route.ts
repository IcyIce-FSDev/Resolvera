import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getRequestUser, AuthenticatedRequest } from '@/lib/auth/middleware';
import { queryAuditLogs, AuditAction, AuditSeverity } from '@/lib/audit/logger';

export async function GET(request: NextRequest) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      // Check if user is admin
      const user = getRequestUser(req);
      if (user.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Admin access required' },
          { status: 403 }
        );
      }

      // Parse query parameters
      const searchParams = request.nextUrl.searchParams;
      const userId = searchParams.get('userId') || undefined;
      const action = searchParams.get('action') as AuditAction | undefined;
      const severity = searchParams.get('severity') as AuditSeverity | undefined;
      const keyword = searchParams.get('keyword') || undefined;
      const limit = parseInt(searchParams.get('limit') || '100');
      const offset = parseInt(searchParams.get('offset') || '0');

      // Date filtering
      const startDateStr = searchParams.get('startDate');
      const endDateStr = searchParams.get('endDate');
      const startDate = startDateStr ? new Date(startDateStr) : undefined;
      const endDate = endDateStr ? new Date(endDateStr) : undefined;

      // Query audit logs
      const result = await queryAuditLogs({
        userId,
        action,
        severity,
        keyword,
        startDate,
        endDate,
        limit,
        offset,
      });

      return NextResponse.json({
        success: true,
        data: {
          logs: result.logs,
          total: result.total,
          limit,
          offset,
        },
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch audit logs',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  });
}

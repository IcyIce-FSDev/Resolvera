import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthenticatedRequest } from '@/lib/auth/middleware';
import { getSchedulerStatus, restartWatcherScheduler } from '@/lib/watcher/scheduler';
import { runBackgroundWatcherCheck } from '@/lib/watcher/background-checker';
import { createAuditLog, getUserInfoFromRequest } from '@/lib/audit/logger';

/**
 * GET /api/admin/watcher-scheduler
 * Get scheduler status
 */
export async function GET(request: NextRequest) {
  return requireAdmin(request, async (_req: AuthenticatedRequest) => {
    try {
      const status = getSchedulerStatus();

      return NextResponse.json({
        success: true,
        data: status,
      });
    } catch (error) {
      console.error('[API] Error getting scheduler status:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to get scheduler status' },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/admin/watcher-scheduler
 * Trigger manual check or restart scheduler
 */
export async function POST(request: NextRequest) {
  return requireAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const { action } = body;

      const userInfo = getUserInfoFromRequest(request, req.user);

      if (action === 'check') {
        // Run manual check
        const result = await runBackgroundWatcherCheck();

        await createAuditLog({
          action: 'watcher.check.triggered',
          ...userInfo,
          resource: 'watcher_scheduler',
          details: {
            manual: true,
            checkedCount: result.checkedCount,
            errors: result.errors,
          },
          success: result.success,
          error: result.errors.length > 0 ? result.errors.join('; ') : undefined,
        });

        return NextResponse.json({
          success: true,
          data: {
            message: 'Manual check completed',
            checkedCount: result.checkedCount,
            errors: result.errors,
          },
        });
      } else if (action === 'restart') {
        // Restart scheduler
        await restartWatcherScheduler();

        await createAuditLog({
          action: 'watcher.settings.updated',
          ...userInfo,
          resource: 'watcher_scheduler',
          details: {
            action: 'restart',
          },
          success: true,
        });

        return NextResponse.json({
          success: true,
          data: {
            message: 'Scheduler restarted',
            status: getSchedulerStatus(),
          },
        });
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use "check" or "restart"' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('[API] Error in scheduler action:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to execute scheduler action' },
        { status: 500 }
      );
    }
  });
}

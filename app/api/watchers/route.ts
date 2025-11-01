import { NextRequest, NextResponse } from 'next/server';
import { getWatchers, addWatcher } from '@/lib/storage/watchers';
import { getZones } from '@/lib/cloudflare/zones';
import { requireAuth, getRequestUser, AuthenticatedRequest } from '@/lib/auth/middleware';
import { watcherSchema, validateSchema } from '@/lib/validation/schemas';
import { sendNotification } from '@/lib/services/notification';
import { createAuditLog, getUserInfoFromRequest } from '@/lib/audit/logger';

// Get all watchers
export async function GET(request: NextRequest) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      // Get authenticated user from JWT
      const user = getRequestUser(req);

      // Get all watchers
      let watchers = await getWatchers();

      // Filter watchers based on user role and assignments
      if (user.role !== 'admin') {
        if (user.assignedZoneIds && user.assignedZoneIds.length > 0) {
          // Get zone names for assigned zone IDs
          const allZones = await getZones();
          const assignedZoneNames = allZones
            .filter(zone => user.assignedZoneIds!.includes(zone.zoneId))
            .map(zone => zone.zoneName);

          // Filter watchers to only those for assigned zones
          watchers = watchers.filter(watcher =>
            assignedZoneNames.includes(watcher.zoneName)
          );
        } else {
          // User has no assigned zones
          watchers = [];
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          watchers,
          count: watchers.length,
        },
      });
    } catch (error) {
      console.error('Error fetching watchers:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch watchers',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  });
}

// Create a new watcher
export async function POST(request: NextRequest) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();

      // Validate input with Zod
      const validation = validateSchema(watcherSchema, body);
      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            errors: validation.errors
          },
          { status: 400 }
        );
      }

      const { recordName, recordType, zoneName, enabled } = validation.data!;

      // Get authenticated user
      const user = getRequestUser(req);

      // Get zone configuration to check access
      const zones = await getZones();
      const zoneConfig = zones.find((z) => z.zoneName === zoneName);
      if (!zoneConfig) {
        return NextResponse.json(
          {
            success: false,
            error: 'Zone configuration not found',
          },
          { status: 404 }
        );
      }

      // Check if user has access to this zone
      if (user.role !== 'admin') {
        if (!user.assignedZoneIds || !user.assignedZoneIds.includes(zoneConfig.zoneId)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Access denied: You do not have permission to modify this zone',
            },
            { status: 403 }
          );
        }
      }

      const watcher = await addWatcher({
        recordName,
        recordType,
        zoneName,
        enabled: enabled ?? true,
      });

      // Send notification
      await sendNotification({
        type: 'watcher_add',
        data: {
          watcherName: recordName,
          domain: recordName,
          recordType: recordType,
          timestamp: new Date().toISOString(),
        },
      });

      // Create audit log
      const userInfo = getUserInfoFromRequest(request, user);
      await createAuditLog({
        action: 'watcher.created',
        ...userInfo,
        resource: 'watcher',
        resourceId: watcher.id,
        details: {
          recordName,
          recordType,
          zoneName,
          enabled: enabled ?? true,
        },
        success: true,
      });

      return NextResponse.json({
        success: true,
        data: { watcher },
      });
    } catch (error) {
      console.error('Error creating watcher:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create watcher',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  });
}

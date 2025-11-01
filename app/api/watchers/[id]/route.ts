import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest, getRequestUser } from '@/lib/auth/middleware';
import { updateWatcher, deleteWatcher } from '@/lib/storage/watchers';
import { watcherSchema, validateSchema } from '@/lib/validation/schemas';
import { getWatcherById } from '@/lib/db/database';
import { getZones } from '@/lib/cloudflare/zones';
import { sendNotification } from '@/lib/services/notification';
import { createAuditLog, getUserInfoFromRequest } from '@/lib/audit/logger';

// Update a watcher
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params;
      const body = await req.json();

      // Get authenticated user
      const user = getRequestUser(req);

      // Get the existing watcher to check zone access
      const existingWatcher = await getWatcherById(id);
      if (!existingWatcher) {
        return NextResponse.json(
          {
            success: false,
            error: 'Watcher not found',
          },
          { status: 404 }
        );
      }

      // Get zone configuration to get zone ID
      const zones = await getZones();
      const zoneConfig = zones.find((z) => z.zoneName === existingWatcher.zoneName);
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

      // Validate input with Zod (partial validation for updates)
      const validation = validateSchema(watcherSchema.partial(), body);
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

      const watcher = await updateWatcher(id, validation.data!);

    if (!watcher) {
      return NextResponse.json(
        {
          success: false,
          error: 'Watcher not found',
        },
        { status: 404 }
      );
    }

      // Send notification
      await sendNotification({
        type: 'watcher_edit',
        data: {
          watcherName: watcher.recordName,
          domain: watcher.recordName,
          timestamp: new Date().toISOString(),
        },
      });

      // Create audit log
      const userInfo = getUserInfoFromRequest(request, user);
      const action = validation.data!.enabled !== undefined ? 'watcher.toggled' : 'watcher.updated';
      await createAuditLog({
        action,
        ...userInfo,
        resource: 'watcher',
        resourceId: id,
        details: {
          recordName: watcher.recordName,
          recordType: watcher.recordType,
          zoneName: watcher.zoneName,
          changes: validation.data!,
        },
        success: true,
      });

      return NextResponse.json({
        success: true,
        data: { watcher },
      });
    } catch (error) {
      console.error('Error updating watcher:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update watcher',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  });
}

// Delete a watcher
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params;

      // Get authenticated user
      const user = getRequestUser(req);

      // Get the existing watcher to check zone access
      const existingWatcher = await getWatcherById(id);
      if (!existingWatcher) {
        return NextResponse.json(
          {
            success: false,
            error: 'Watcher not found',
          },
          { status: 404 }
        );
      }

      // Get zone configuration to get zone ID
      const zones = await getZones();
      const zoneConfig = zones.find((z) => z.zoneName === existingWatcher.zoneName);
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

    const success = await deleteWatcher(id);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Watcher not found',
        },
        { status: 404 }
      );
    }

      // Send notification
      await sendNotification({
        type: 'watcher_delete',
        data: {
          watcherName: existingWatcher.recordName,
          domain: existingWatcher.recordName,
          timestamp: new Date().toISOString(),
        },
      });

      // Create audit log
      const userInfo = getUserInfoFromRequest(request, user);
      await createAuditLog({
        action: 'watcher.deleted',
        ...userInfo,
        resource: 'watcher',
        resourceId: id,
        details: {
          recordName: existingWatcher.recordName,
          recordType: existingWatcher.recordType,
          zoneName: existingWatcher.zoneName,
        },
        success: true,
      });

      return NextResponse.json({
        success: true,
        message: 'Watcher deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting watcher:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete watcher',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  });
}

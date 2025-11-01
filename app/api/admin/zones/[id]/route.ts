import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthenticatedRequest, getRequestUser } from '@/lib/auth/middleware';
import { deleteZone, getZoneByZoneId } from '@/lib/db/database';
import { createAuditLog, getUserInfoFromRequest } from '@/lib/audit/logger';

// Delete a zone
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { id: zoneId } = await params;

      // Find the zone
      const zone = await getZoneByZoneId(zoneId);

      if (!zone) {
        return NextResponse.json(
          {
            success: false,
            error: 'Zone not found',
          },
          { status: 404 }
        );
      }

      // Delete the zone
      await deleteZone(zone.id);

      // Log successful zone deletion
      const adminUser = getRequestUser(req);
      await createAuditLog({
        action: 'dns.zone.removed',
        severity: 'info',
        ...getUserInfoFromRequest(request, adminUser),
        resource: 'zone',
        resourceId: zoneId,
        details: {
          zoneName: zone.zoneName,
          zoneId: zone.zoneId,
        },
        success: true,
      });

      return NextResponse.json({
        success: true,
        message: 'Zone removed successfully',
      });
    } catch (error) {
      console.error('Error deleting zone:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete zone',
        },
        { status: 500 }
      );
    }
  });
}

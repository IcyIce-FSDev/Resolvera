import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthenticatedRequest, getRequestUser } from '@/lib/auth/middleware';
import { getZones, saveZone } from '@/lib/cloudflare/zones';
import { addZoneSchema, validateSchema } from '@/lib/validation/schemas';
import { createAuditLog, getUserInfoFromRequest } from '@/lib/audit/logger';
import { getZoneByZoneId } from '@/lib/db/database';

// Get all zones
export async function GET(request: NextRequest) {
  return requireAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const user = getRequestUser(req);

      // Get all zones from database
      const allZones = await getZones();

      // Filter zones based on user role and assignments
      let zones = allZones;

      if (user.role !== 'admin') {
        if (user.assignedZoneIds && user.assignedZoneIds.length > 0) {
          // Filter to only show zones the user is assigned to
          zones = allZones.filter((zone) =>
            user.assignedZoneIds!.includes(zone.zoneId)
          );
        } else {
          // User has no assigned zones
          zones = [];
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          zones: zones,
          count: zones.length,
        },
      });
    } catch (error) {
      console.error('Error reading zones:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to read zones',
        },
        { status: 500 }
      );
    }
  });
}

// Add a new zone
export async function POST(request: NextRequest) {
  return requireAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();

      // Validate input with Zod
      const validation = validateSchema(addZoneSchema, body);
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

      const { zoneName, zoneId, apiToken } = validation.data!;

    // Check if zone already exists
    const existingZone = await getZoneByZoneId(zoneId);

    if (existingZone) {
      // Log failed zone addition attempt
      const adminUser = getRequestUser(req);
      await createAuditLog({
        action: 'dns.zone.added',
        severity: 'warning',
        ...getUserInfoFromRequest(request, adminUser),
        resource: 'zone',
        resourceId: zoneId,
        details: {
          zoneName,
          zoneId,
        },
        success: false,
        error: 'Zone already exists',
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Zone already exists',
        },
        { status: 400 }
      );
    }

    // Save zone with encryption
    await saveZone({
      zoneName,
      zoneId,
      apiToken,
    });

    // Log successful zone addition
    const adminUser = getRequestUser(req);
    await createAuditLog({
      action: 'dns.zone.added',
      severity: 'info',
      ...getUserInfoFromRequest(request, adminUser),
      resource: 'zone',
      resourceId: zoneId,
      details: {
        zoneName,
        zoneId,
      },
      success: true,
    });

      return NextResponse.json({
        success: true,
        data: {
          zoneName,
          zoneId,
        },
      });
    } catch (error) {
      console.error('Error adding zone:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to add zone',
        },
        { status: 500 }
      );
    }
  });
}

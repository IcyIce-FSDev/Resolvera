import { NextRequest, NextResponse } from 'next/server';
import { getZones, fetchZoneInfo } from '@/lib/cloudflare/zones';
import { requireAuth, getRequestUser, AuthenticatedRequest } from '@/lib/auth/middleware';
import { cfCache, buildZoneKey, getCacheTTL } from '@/lib/cache/cloudflare';

export async function GET(request: NextRequest) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      // Get authenticated user from JWT
      const user = getRequestUser(req);

      // Get all zones from database
      const allZones = await getZones();

      // Filter zones based on user role and assignments
      let allowedZones = allZones;

      if (user.role !== 'admin') {
        // User has assignedZoneIds array (Cloudflare zone IDs)
        if (user.assignedZoneIds && user.assignedZoneIds.length > 0) {
          // Filter to only show zones the user is assigned to
          allowedZones = allZones.filter(zone =>
            user.assignedZoneIds!.includes(zone.zoneId)
          );
        } else {
          // User has no assigned zones
          allowedZones = [];
        }
      }

    // Fetch additional info for each allowed zone from Cloudflare with caching
    const zonesWithInfo = await Promise.allSettled(
      allowedZones.map(async (zone) => {
        try {
          const cacheKey = buildZoneKey(zone.zoneId);

          // Try to get from cache first
          let zoneData = cfCache.get<any>(cacheKey);

          if (!zoneData) {
            // Cache miss - fetch from Cloudflare API
            const info = await fetchZoneInfo(zone);
            zoneData = {
              zoneName: zone.zoneName,
              zoneId: zone.zoneId,
              status: info.status,
              nameServers: info.name_servers,
              createdOn: info.created_on,
              modifiedOn: info.modified_on,
            };
            // Store in cache
            const ttl = getCacheTTL();
            cfCache.set(cacheKey, zoneData, ttl.ZONE_INFO);
          }

          return zoneData;
        } catch (error) {
          // Return basic info if API call fails
          return {
            zoneName: zone.zoneName,
            zoneId: zone.zoneId,
            status: 'unknown',
            error: 'Failed to fetch zone details',
          };
        }
      })
    );

    const results = zonesWithInfo.map((result) =>
      result.status === 'fulfilled' ? result.value : null
    ).filter(Boolean);

      return NextResponse.json({
        success: true,
        data: {
          zones: results,
          count: results.length,
        },
      });
    } catch (error) {
      console.error('Error fetching zones:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch zones',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  });
}

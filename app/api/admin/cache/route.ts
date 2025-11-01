import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthenticatedRequest } from '@/lib/auth/middleware';
import { cfCache, getCacheTTL, updateCacheTTL } from '@/lib/cache/cloudflare';
import { createAuditLog, getUserInfoFromRequest } from '@/lib/audit/logger';
import { getRequestUser } from '@/lib/auth/middleware';

// Get cache statistics and configuration
export async function GET(request: NextRequest) {
  return requireAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const stats = cfCache.stats();
      const ttlConfig = getCacheTTL();

      return NextResponse.json({
        success: true,
        data: {
          ...stats,
          ttl: ttlConfig,
        },
      });
    } catch (error) {
      console.error('Error fetching cache stats:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch cache statistics',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  });
}

// Update cache TTL configuration
export async function PATCH(request: NextRequest) {
  return requireAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const user = getRequestUser(req);
      const body = await request.json();

      // Validate TTL values
      const ttlConfig: any = {};
      if (body.ZONES !== undefined) {
        const zones = parseInt(body.ZONES);
        if (isNaN(zones) || zones < 0) {
          return NextResponse.json(
            { success: false, error: 'Invalid ZONES TTL value' },
            { status: 400 }
          );
        }
        ttlConfig.ZONES = zones;
      }

      if (body.DNS_RECORDS !== undefined) {
        const dnsRecords = parseInt(body.DNS_RECORDS);
        if (isNaN(dnsRecords) || dnsRecords < 0) {
          return NextResponse.json(
            { success: false, error: 'Invalid DNS_RECORDS TTL value' },
            { status: 400 }
          );
        }
        ttlConfig.DNS_RECORDS = dnsRecords;
      }

      if (body.ZONE_INFO !== undefined) {
        const zoneInfo = parseInt(body.ZONE_INFO);
        if (isNaN(zoneInfo) || zoneInfo < 0) {
          return NextResponse.json(
            { success: false, error: 'Invalid ZONE_INFO TTL value' },
            { status: 400 }
          );
        }
        ttlConfig.ZONE_INFO = zoneInfo;
      }

      // Get old config for logging
      const oldConfig = getCacheTTL();

      // Update TTL configuration
      updateCacheTTL(ttlConfig);

      // Get new config
      const newConfig = getCacheTTL();

      // Log configuration change
      await createAuditLog({
        action: 'cache.config.updated',
        severity: 'info',
        ...getUserInfoFromRequest(request, user),
        resource: 'cache',
        resourceId: 'cloudflare_cache_config',
        details: {
          oldConfig,
          newConfig,
          changes: ttlConfig,
        },
        success: true,
      });

      return NextResponse.json({
        success: true,
        message: 'Cache TTL configuration updated successfully',
        data: {
          ttl: newConfig,
        },
      });
    } catch (error) {
      console.error('Error updating cache config:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update cache configuration',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  });
}

// Clear cache
export async function DELETE(request: NextRequest) {
  return requireAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const user = getRequestUser(req);

      // Get cache stats before clearing
      const statsBefore = cfCache.stats();

      // Clear the cache
      cfCache.clear();

      // Log cache clear action
      await createAuditLog({
        action: 'cache.cleared',
        severity: 'info',
        ...getUserInfoFromRequest(request, user),
        resource: 'cache',
        resourceId: 'cloudflare_cache',
        details: {
          entriesCleared: statsBefore.size,
        },
        success: true,
      });

      return NextResponse.json({
        success: true,
        message: 'Cache cleared successfully',
        data: {
          entriesCleared: statsBefore.size,
        },
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to clear cache',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { fetchDNSRecordsForZone } from '@/lib/cloudflare/zones';
import { requireAuth, getRequestUser, AuthenticatedRequest } from '@/lib/auth/middleware';
import { dnsRecordSchema, validateSchema } from '@/lib/validation/schemas';
import { cfCache, buildDNSRecordsKey, getCacheTTL } from '@/lib/cache/cloudflare';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api/responses';
import { getAuthorizedZones, authorizeDNSRecordAccessById } from '@/lib/api/dns/authorization';
import { createDNSRecord } from '@/lib/cloudflare/api';
import { logDNSOperation } from '@/lib/api/audit';
import { notifyDNSRecordAdd } from '@/lib/api/notifications';

interface CloudflareRecord {
  id: string;
  name: string;
  type: string;
  content: string;
  ttl: number;
  proxied: boolean;
  zone_name?: string;
}

export async function GET(request: NextRequest) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      // Get authenticated user from JWT
      const user = getRequestUser(req);

      // Get zones user has access to
      const allowedZones = await getAuthorizedZones(user);

      // Fetch DNS records for allowed zones with caching
      const allRecords: CloudflareRecord[] = [];
      for (const zone of allowedZones) {
        try {
          const cacheKey = buildDNSRecordsKey(zone.zoneId);

          // Try to get from cache first
          let records = cfCache.get<CloudflareRecord[]>(cacheKey);

          if (!records) {
            // Cache miss - fetch from Cloudflare API
            records = await fetchDNSRecordsForZone(zone);
            // Store in cache
            const ttl = getCacheTTL();
            cfCache.set(cacheKey, records, ttl.DNS_RECORDS);
          }

          allRecords.push(...records);
        } catch (error) {
          console.error(`Failed to fetch records for zone ${zone.zoneName}:`, error);
          // Continue with other zones even if one fails
        }
      }

      const response = successResponse({
        records: allRecords,
        count: allRecords.length,
      });

      // Prevent HTTP caching - always fetch fresh data
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');

      return response;
    } catch (error) {
      console.error('Error fetching DNS records:', error);
      return errorResponse(error, 500);
    }
  });
}

// Create a new DNS record
export async function POST(request: NextRequest) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();

      // Validate input with Zod
      const validation = validateSchema(dnsRecordSchema, body);
      if (!validation.success) {
        return validationErrorResponse(validation.errors || []);
      }

      const { type, name, content, ttl, proxied, zoneId, comment } = validation.data!;

      // Validate that zoneId is provided for creation
      if (!zoneId) {
        return errorResponse('Zone ID is required for creating DNS records', 400);
      }

      // Get authenticated user
      const user = getRequestUser(req);

      // Authorize access to this zone
      const auth = await authorizeDNSRecordAccessById(user, zoneId);
      if (!auth.authorized) {
        return errorResponse(auth.error!, auth.statusCode!);
      }

      // Create the record via Cloudflare API
      const data = await createDNSRecord(
        auth.zoneConfig!.zoneId,
        auth.zoneConfig!.apiToken,
        {
          type,
          name,
          content,
          ttl: ttl || 1,
          proxied: proxied || false,
          ...(comment && { comment }),
        }
      );

      if (!data.success) {
        // Log failed DNS record creation
        await logDNSOperation(
          'created',
          request,
          user,
          zoneId,
          {
            zoneName: auth.zoneConfig!.zoneName,
            recordType: type,
            recordName: name,
            content: content,
            cfErrors: data.errors,
          },
          false,
          'Cloudflare API error'
        );
        return errorResponse('Failed to create DNS record', 400);
      }

      // Log successful DNS record creation
      await logDNSOperation(
        'created',
        request,
        user,
        data.result.id,
        {
          zoneName: auth.zoneConfig!.zoneName,
          recordType: type,
          recordName: name,
          content: content,
          ttl,
          proxied,
        },
        true
      );

      // Send notification
      await notifyDNSRecordAdd(name, type, content);

      // Invalidate cache for this zone's DNS records
      cfCache.invalidate(buildDNSRecordsKey(zoneId));

      return successResponse({
        ...data.result,
        zone_name: auth.zoneConfig!.zoneName,
      });
    } catch (error) {
      console.error('Error creating DNS record:', error);
      return errorResponse(error, 500);
    }
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest, getRequestUser } from '@/lib/auth/middleware';
import { dnsRecordSchema, validateSchema } from '@/lib/validation/schemas';
import { cfCache, buildDNSRecordsKey } from '@/lib/cache/cloudflare';
import { getWatchers } from '@/lib/storage/watchers';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api/responses';
import { authorizeDNSRecordAccessByName } from '@/lib/api/dns/authorization';
import { updateDNSRecord, deleteDNSRecord } from '@/lib/cloudflare/api';
import { logDNSOperation } from '@/lib/api/audit';
import { notifyDNSRecordEdit, notifyDNSRecordDelete } from '@/lib/api/notifications';

// Update a DNS record
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params;
      const body = await request.json();

      // Extract zone_name before validation (not part of DNS record schema)
      const { zone_name, old_content, ...recordData } = body;

      if (!zone_name) {
        return errorResponse('zone_name is required', 400);
      }

      // Validate DNS record data with Zod
      const validation = validateSchema(dnsRecordSchema, recordData);
      if (!validation.success) {
        return validationErrorResponse(validation.errors || []);
      }

      const { type, name, content, ttl, proxied } = validation.data!;

      // Get authenticated user
      const user = getRequestUser(req);

      // Authorize access to this zone
      const auth = await authorizeDNSRecordAccessByName(user, zone_name);
      if (!auth.authorized) {
        return errorResponse(auth.error!, auth.statusCode!);
      }

      // Update the record via Cloudflare API
      const data = await updateDNSRecord(
        auth.zoneConfig!.zoneId,
        auth.zoneConfig!.apiToken,
        id,
        { type, name, content, ttl, proxied }
      );

      if (!data.success) {
        // Log failed update
        await logDNSOperation(
          'updated',
          request,
          user,
          id,
          { zoneName: zone_name, recordType: type, recordName: name, cfErrors: data.errors },
          false,
          'Cloudflare API error'
        );
        return errorResponse('Failed to update DNS record', 400);
      }

      // Log successful update
      await logDNSOperation(
        'updated',
        request,
        user,
        id,
        { zoneName: zone_name, recordType: type, recordName: name, content, ttl, proxied },
        true
      );

      // Check if this record is being watched for notification logic
      const watchers = await getWatchers();
      const isWatched = watchers.some(
        w => w.recordName === name && w.recordType === type && w.zoneName === zone_name
      );

      // Send appropriate notification
      const isIPRecord = type === 'A' || type === 'AAAA';
      const isIPUpdate = isIPRecord && old_content && old_content !== content;

      if (isWatched && isIPUpdate) {
        // Manual IP update on watched record
        await notifyDNSRecordEdit(
          name,
          type,
          old_content,
          content,
          user.name || user.email || 'User'
        );
      } else {
        // Regular DNS record edit
        await notifyDNSRecordEdit(name, type, old_content || 'N/A', content);
      }

      // Invalidate cache
      cfCache.invalidate(buildDNSRecordsKey(auth.zoneConfig!.zoneId));

      return successResponse(data.result);
    } catch (error) {
      console.error('Error updating DNS record:', error);
      return errorResponse(error, 500);
    }
  });
}

// Delete a DNS record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params;

      // Try to parse JSON body
      let body;
      try {
        body = await request.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON body:', jsonError);
        return errorResponse('Invalid JSON in request body', 400);
      }

      const { zone_name, record_name, name, record_type, type, content } = body;

      if (!zone_name) {
        return errorResponse('zone_name is required', 400);
      }

      // Get authenticated user
      const user = getRequestUser(req);

      // Authorize access to this zone
      const auth = await authorizeDNSRecordAccessByName(user, zone_name);
      if (!auth.authorized) {
        return errorResponse(auth.error!, auth.statusCode!);
      }

      // Delete the record via Cloudflare API
      const data = await deleteDNSRecord(
        auth.zoneConfig!.zoneId,
        auth.zoneConfig!.apiToken,
        id
      );

      if (!data.success) {
        // Log failed deletion
        await logDNSOperation(
          'deleted',
          request,
          user,
          id,
          { zoneName: zone_name, cfErrors: data.errors },
          false,
          'Cloudflare API error'
        );
        return errorResponse('Failed to delete DNS record', 400);
      }

      // Log successful deletion
      await logDNSOperation(
        'deleted',
        request,
        user,
        id,
        { zoneName: zone_name },
        true
      );

      // Send notification
      await notifyDNSRecordDelete(
        record_name || name || zone_name,
        record_type || type || 'A',
        content || 'N/A'
      );

      // Invalidate cache
      cfCache.invalidate(buildDNSRecordsKey(auth.zoneConfig!.zoneId));

      return successResponse({ message: 'DNS record deleted successfully' });
    } catch (error) {
      console.error('Error deleting DNS record:', error);
      return errorResponse(error, 500);
    }
  });
}

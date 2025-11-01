import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { getWatchers, updateWatcher } from '@/lib/storage/watchers';
import { fetchAllDNSRecords, getZones } from '@/lib/cloudflare/zones';
import { getWatcherSettings } from '@/lib/db/database';
import { sendNotification } from '@/lib/services/notification';

// Check all watchers against current DNS records and server IP
export async function POST(request: NextRequest) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    const user = req.user!;

    // Rate limit: 10 checks per minute per user
    const rateLimitResult = checkRateLimit(
      `watcher-check:${user.userId}`,
      { maxRequests: 10, windowMs: 60000 }
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          resetTime: rateLimitResult.resetTime
        },
        { status: 429 }
      );
    }
    try {
    // Get watcher settings
    const settingsData = await getWatcherSettings();
    const settings = {
      enabled: settingsData?.checkIntervalMinutes !== undefined ? true : true,
      checkInterval: settingsData?.checkIntervalMinutes || 5,
      autoUpdate: settingsData?.autoUpdateEnabled || false,
      notifyOnMismatch: settingsData?.notifyOnMismatch !== undefined ? settingsData.notifyOnMismatch : true,
    };

    // Check if watcher is enabled (assuming enabled if settings exist)
    if (!settings.enabled) {
      return NextResponse.json({
        success: true,
        data: {
          results: [],
          message: 'Watcher is disabled',
          serverIPs: {},
        },
      });
    }

    const watchers = await getWatchers();

    // Get current server IPs
    const ipResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/ip`);
    const ipData = await ipResponse.json();

    if (!ipData.success) {
      throw new Error('Failed to fetch server IP');
    }

    const serverIPv4 = ipData.data.ipv4;
    const serverIPv6 = ipData.data.ipv6;

    // Get all DNS records
    const dnsRecords = await fetchAllDNSRecords();

    // Check each watcher
    const results = await Promise.all(watchers.map(async watcher => {
      if (!watcher.enabled) {
        return { ...watcher, status: 'disabled' as const };
      }

      // Find the DNS record
      const record = dnsRecords.find(
        r => r.name === watcher.recordName &&
             r.type === watcher.recordType &&
             r.zone_name === watcher.zoneName
      );

      if (!record) {
        await updateWatcher(watcher.id, {
          status: 'error',
          lastChecked: new Date().toISOString(),
          currentIP: undefined,
          expectedIP: watcher.recordType === 'A' ? serverIPv4 : serverIPv6,
        });

        return {
          ...watcher,
          status: 'error' as const,
          message: 'DNS record not found',
        };
      }

      // Compare IPs
      const expectedIP = watcher.recordType === 'A' ? serverIPv4 : serverIPv6;
      const currentIP = record.content;

      if (!expectedIP) {
        await updateWatcher(watcher.id, {
          status: 'error',
          lastChecked: new Date().toISOString(),
          currentIP,
        });

        return {
          ...watcher,
          status: 'error' as const,
          message: `Server ${watcher.recordType === 'A' ? 'IPv4' : 'IPv6'} not available`,
        };
      }

      const isMatch = currentIP === expectedIP;

      // Auto-update DNS record if enabled and mismatch detected
      if (!isMatch && settings.autoUpdate) {
        try {
          // Get zone config to update the record
          const zones = await getZones();
          const zone = zones.find((z) => z.zoneName === watcher.zoneName);

          if (zone) {
            // API token is already decrypted by getZones()
            const apiToken = zone.apiToken;

            // Update the DNS record via Cloudflare API
            await fetch(
              `https://api.cloudflare.com/client/v4/zones/${zone.zoneId}/dns_records/${record.id}`,
              {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${apiToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  type: record.type,
                  name: record.name,
                  content: expectedIP,
                  ttl: record.ttl,
                  proxied: record.proxied,
                }),
              }
            );

            await updateWatcher(watcher.id, {
              status: 'ok',
              lastChecked: new Date().toISOString(),
              currentIP: expectedIP,
              expectedIP,
            });

            // Send notification for auto IP update
            await sendNotification({
              type: 'watcher_ip_update_auto',
              data: {
                domain: watcher.recordName,
                recordType: watcher.recordType,
                oldIP: currentIP,
                newIP: expectedIP,
                timestamp: new Date().toISOString(),
              },
            });

            return {
              ...watcher,
              status: 'ok' as const,
              currentIP: expectedIP,
              expectedIP,
              message: 'IP mismatch auto-updated',
            };
          }
        } catch (error) {
          console.error('Failed to auto-update DNS record:', error);
          // Fall through to normal mismatch handling
        }
      }

      await updateWatcher(watcher.id, {
        status: isMatch ? 'ok' : 'mismatch',
        lastChecked: new Date().toISOString(),
        currentIP,
        expectedIP,
      });

      return {
        ...watcher,
        status: isMatch ? ('ok' as const) : ('mismatch' as const),
        currentIP,
        expectedIP,
        message: isMatch ? 'IP matches' : 'IP mismatch detected',
      };
    }));

    return NextResponse.json({
      success: true,
      data: {
        results,
        serverIPs: {
          ipv4: serverIPv4,
          ipv6: serverIPv6,
        },
      },
    });
    } catch (error) {
      console.error('Error checking watchers:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to check watchers',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  });
}

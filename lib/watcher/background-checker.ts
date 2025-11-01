import { getWatchers, updateWatcher } from '@/lib/storage/watchers';
import { fetchAllDNSRecords, getZones } from '@/lib/cloudflare/zones';
import { getWatcherSettings } from '@/lib/db/database';
import { sendNotification } from '@/lib/services/notification';
import { createAuditLog } from '@/lib/audit/logger';

/**
 * Background watcher check function
 * Runs without authentication for scheduled background tasks
 */
export async function runBackgroundWatcherCheck(): Promise<{
  success: boolean;
  checkedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let checkedCount = 0;

  try {
    // Get watcher settings
    const settingsData = await getWatcherSettings();
    const settings = {
      enabled: settingsData?.checkIntervalMinutes !== undefined ? true : true,
      checkInterval: settingsData?.checkIntervalMinutes || 5,
      autoUpdate: settingsData?.autoUpdateEnabled || false,
      notifyOnMismatch: settingsData?.notifyOnMismatch !== undefined ? settingsData.notifyOnMismatch : true,
    };

    // Check if watcher is enabled
    if (!settings.enabled) {
      return { success: true, checkedCount: 0, errors: [] };
    }

    const watchers = await getWatchers();

    if (watchers.length === 0) {
      return { success: true, checkedCount: 0, errors: [] };
    }

    // Get current server IPs
    let serverIPv4: string | undefined;
    let serverIPv6: string | undefined;

    try {
      const ipResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/ip`);
      const ipData = await ipResponse.json();

      if (ipData.success) {
        serverIPv4 = ipData.data.ipv4;
        serverIPv6 = ipData.data.ipv6;
      } else {
        errors.push('Failed to fetch server IP');
        return { success: false, checkedCount: 0, errors };
      }
    } catch (error) {
      errors.push(`Failed to fetch server IP: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, checkedCount: 0, errors };
    }

    // Get all DNS records
    let dnsRecords;
    try {
      dnsRecords = await fetchAllDNSRecords();
    } catch (error) {
      errors.push(`Failed to fetch DNS records: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, checkedCount: 0, errors };
    }

    // Check each watcher
    for (const watcher of watchers) {
      if (!watcher.enabled) {
        continue;
      }

      try {
        checkedCount++;

        // Store previous status for change detection
        const previousStatus = watcher.status;

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

          errors.push(`DNS record not found for ${watcher.recordName}`);

          // Only create audit log if status changed
          if (previousStatus !== 'error') {
            await createAuditLog({
              action: 'watcher.check.triggered',
              severity: 'error',
              resource: 'watcher',
              resourceId: watcher.id,
              details: {
                recordName: watcher.recordName,
                recordType: watcher.recordType,
                zoneName: watcher.zoneName,
                error: 'DNS record not found',
                previousStatus,
                newStatus: 'error',
              },
              success: false,
              error: 'DNS record not found',
            });
          }

          continue;
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

          errors.push(`Server ${watcher.recordType === 'A' ? 'IPv4' : 'IPv6'} not available for ${watcher.recordName}`);
          continue;
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
              const updateResponse = await fetch(
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

              if (!updateResponse.ok) {
                throw new Error(`Cloudflare API error: ${updateResponse.statusText}`);
              }

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

              // Create audit log for auto-update
              await createAuditLog({
                action: 'watcher.check.triggered',
                severity: 'info',
                resource: 'watcher',
                resourceId: watcher.id,
                details: {
                  recordName: watcher.recordName,
                  recordType: watcher.recordType,
                  zoneName: watcher.zoneName,
                  oldIP: currentIP,
                  newIP: expectedIP,
                  autoUpdated: true,
                },
                success: true,
              });

              continue;
            }
          } catch (error) {
            errors.push(`Auto-update failed for ${watcher.recordName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            // Fall through to normal mismatch handling
          }
        }

        // Update watcher status
        await updateWatcher(watcher.id, {
          status: isMatch ? 'ok' : 'mismatch',
          lastChecked: new Date().toISOString(),
          currentIP,
          expectedIP,
        });

        // Send notification if mismatch detected and notifications enabled
        if (!isMatch && settings.notifyOnMismatch) {
          await sendNotification({
            type: 'watcher_ip_update_manual',
            data: {
              domain: watcher.recordName,
              recordType: watcher.recordType,
              currentIP,
              expectedIP,
              timestamp: new Date().toISOString(),
            },
          });
        }

        // Only create audit log if status changed
        const newStatus = isMatch ? 'ok' : 'mismatch';
        if (previousStatus !== newStatus) {
          await createAuditLog({
            action: 'watcher.check.triggered',
            severity: isMatch ? 'info' : 'warning',
            resource: 'watcher',
            resourceId: watcher.id,
            details: {
              recordName: watcher.recordName,
              recordType: watcher.recordType,
              zoneName: watcher.zoneName,
              currentIP,
              expectedIP,
              previousStatus,
              newStatus,
            },
            success: true,
          });
        }
      } catch (error) {
        errors.push(`Error checking ${watcher.recordName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: errors.length === 0,
      checkedCount,
      errors,
    };
  } catch (error) {
    errors.push(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      checkedCount,
      errors,
    };
  }
}

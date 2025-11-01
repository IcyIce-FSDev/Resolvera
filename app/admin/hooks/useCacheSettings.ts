import { useState, useEffect } from 'react';
import { fetchCacheStats, updateCacheTTL, clearCache } from '@/lib/admin/adminApi';
import { convertToMs, convertFromMs, autoSelectUnit } from '@/lib/admin/timeConversion';
import type { CacheStats, CacheTTLConfig, Message } from '@/app/admin/types';

export function useCacheSettings(activeTab: string) {
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    size: 0,
    keys: [],
    ttl: {
      ZONES: 0,
      DNS_RECORDS: 0,
      ZONE_INFO: 0,
    },
    entries: [],
  });

  const [ttlConfig, setTtlConfig] = useState<CacheTTLConfig>({
    ZONES: { value: '5', unit: 'mins' },
    DNS_RECORDS: { value: '5', unit: 'mins' },
    ZONE_INFO: { value: '10', unit: 'mins' },
  });

  const [cacheLoading, setCacheLoading] = useState(false);

  // Fetch cache stats when switching to cache tab
  useEffect(() => {
    if (activeTab === 'cache') {
      loadCacheStats();
    }
  }, [activeTab]);

  const loadCacheStats = async () => {
    try {
      setCacheLoading(true);
      const stats = await fetchCacheStats();

      if (stats) {
        setCacheStats(stats);

        // Initialize TTL config form with current values and auto-select units
        if (stats.ttl) {
          const zonesUnit = autoSelectUnit(stats.ttl.ZONES);
          const dnsUnit = autoSelectUnit(stats.ttl.DNS_RECORDS);
          const zoneInfoUnit = autoSelectUnit(stats.ttl.ZONE_INFO);

          setTtlConfig({
            ZONES: {
              value: convertFromMs(stats.ttl.ZONES, zonesUnit),
              unit: zonesUnit,
            },
            DNS_RECORDS: {
              value: convertFromMs(stats.ttl.DNS_RECORDS, dnsUnit),
              unit: dnsUnit,
            },
            ZONE_INFO: {
              value: convertFromMs(stats.ttl.ZONE_INFO, zoneInfoUnit),
              unit: zoneInfoUnit,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error fetching cache stats:', error);
    } finally {
      setCacheLoading(false);
    }
  };

  const handleUpdateTTL = async (): Promise<Message | null> => {
    try {
      setCacheLoading(true);

      // Convert all values to milliseconds
      const zonesMs = convertToMs(ttlConfig.ZONES.value, ttlConfig.ZONES.unit);
      const dnsMs = convertToMs(ttlConfig.DNS_RECORDS.value, ttlConfig.DNS_RECORDS.unit);
      const zoneInfoMs = convertToMs(ttlConfig.ZONE_INFO.value, ttlConfig.ZONE_INFO.unit);

      await updateCacheTTL({
        ZONES: zonesMs,
        DNS_RECORDS: dnsMs,
        ZONE_INFO: zoneInfoMs,
      });

      await loadCacheStats(); // Refresh stats
      return { type: 'success', text: 'Cache TTL configuration updated successfully!' };
    } catch (error) {
      return { type: 'error', text: error instanceof Error ? error.message : 'Failed to update cache configuration' };
    } finally {
      setCacheLoading(false);
    }
  };

  const handleClearCache = async (): Promise<Message | null> => {
    if (!confirm('Are you sure you want to clear all cache? This will force fresh API calls on next request.')) {
      return null;
    }

    try {
      setCacheLoading(true);
      const result = await clearCache();

      await loadCacheStats(); // Refresh stats
      return {
        type: 'success',
        text: `Cache cleared successfully! ${result.data?.entriesCleared || 0} entries removed.`
      };
    } catch (error) {
      return { type: 'error', text: error instanceof Error ? error.message : 'Failed to clear cache' };
    } finally {
      setCacheLoading(false);
    }
  };

  return {
    cacheStats,
    ttlConfig,
    setTtlConfig,
    cacheLoading,
    handleUpdateTTL,
    handleClearCache,
    loadCacheStats,
  };
}

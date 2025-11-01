/**
 * Simple in-memory cache for Cloudflare API responses
 * Reduces API calls and improves performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CloudflareCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Get cached data if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if cache entry has expired
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache data with TTL
   */
  set<T>(key: string, data: T, ttl: number = 30000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Invalidate (delete) a specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; keys: string[]; entries?: any[] } {
    const keys = Array.from(this.cache.keys());
    const entries = keys.map(key => {
      const entry = this.cache.get(key);
      if (entry) {
        const now = Date.now();
        const age = now - entry.timestamp;
        const isExpired = age > entry.ttl;
        return {
          key,
          age: age,
          ttl: entry.ttl,
          expired: isExpired,
          expiresIn: isExpired ? 0 : (entry.ttl - age),
        };
      }
      return null;
    }).filter(Boolean);

    return {
      size: this.cache.size,
      keys: keys,
      entries: entries,
    };
  }
}

// Export singleton instance with global preservation for HMR
// This ensures the cache persists across hot module reloads in development
const globalForCache = globalThis as unknown as {
  cfCache: CloudflareCache | undefined;
};

export const cfCache = globalForCache.cfCache ?? new CloudflareCache();

if (process.env.NODE_ENV !== 'production') {
  globalForCache.cfCache = cfCache;
}

// Cache key builders
export const buildZonesKey = (userId?: string) =>
  userId ? `zones:user:${userId}` : 'zones:all';

export const buildDNSRecordsKey = (zoneId: string) =>
  `dns:records:${zoneId}`;

export const buildZoneKey = (zoneId: string) =>
  `zone:${zoneId}`;

// Default TTL values (in milliseconds)
let CACHE_TTL = {
  ZONES: 300000,       // 5 minutes - zones don't change often
  DNS_RECORDS: 120000, // 2 minutes - records change more frequently
  ZONE_INFO: 600000,   // 10 minutes - zone info rarely changes
};

/**
 * Update cache TTL configuration
 */
export function updateCacheTTL(config: Partial<typeof CACHE_TTL>): void {
  CACHE_TTL = { ...CACHE_TTL, ...config };
}

/**
 * Get current cache TTL configuration
 */
export function getCacheTTL(): typeof CACHE_TTL {
  return { ...CACHE_TTL };
}

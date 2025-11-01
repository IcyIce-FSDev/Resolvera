import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { CacheStats, CacheTTLConfig } from '@/app/admin/types';

interface CacheSettingsTabProps {
  cacheStats: CacheStats;
  ttlConfig: CacheTTLConfig;
  setTtlConfig: (config: CacheTTLConfig) => void;
  cacheLoading: boolean;
  handleUpdateTTL: () => Promise<void>;
  handleClearCache: () => Promise<void>;
  loadCacheStats: () => Promise<void>;
}

export default function CacheSettingsTab({
  cacheStats,
  ttlConfig,
  setTtlConfig,
  cacheLoading,
  handleUpdateTTL,
  handleClearCache,
  loadCacheStats,
}: CacheSettingsTabProps) {
  const CacheTTLInput = ({
    label,
    cacheKey,
    currentMs
  }: {
    label: string;
    cacheKey: keyof CacheTTLConfig;
    currentMs: number;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="number"
          value={ttlConfig[cacheKey].value}
          onChange={(e) => setTtlConfig({
            ...ttlConfig,
            [cacheKey]: { ...ttlConfig[cacheKey], value: e.target.value }
          })}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="30"
          min="0"
          step="0.1"
        />
        <select
          value={ttlConfig[cacheKey].unit}
          onChange={(e) => setTtlConfig({
            ...ttlConfig,
            [cacheKey]: { ...ttlConfig[cacheKey], unit: e.target.value as 'ms' | 'secs' | 'mins' | 'hrs' }
          })}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="ms">ms</option>
          <option value="secs">secs</option>
          <option value="mins">mins</option>
          <option value="hrs">hrs</option>
        </select>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Current: {currentMs} ms
      </p>
    </div>
  );

  return (
    <Card
      title="Cache Management"
      headerAction={
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadCacheStats()}
            isLoading={cacheLoading}
          >
            Refresh Stats
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleClearCache}
            isLoading={cacheLoading}
          >
            Clear All Cache
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Cache Statistics */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Cache Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Cached Entries</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {cacheStats.size}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Memory Usage</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {cacheStats.size > 0 ? 'Active' : 'Empty'}
              </div>
            </div>
          </div>
        </div>

        {/* Cache TTL Configuration */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Cache Duration Settings
          </h3>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="space-y-4">
              <CacheTTLInput
                label="DNS Records Cache TTL"
                cacheKey="DNS_RECORDS"
                currentMs={cacheStats.ttl?.DNS_RECORDS || 30000}
              />

              <CacheTTLInput
                label="Zones List Cache TTL"
                cacheKey="ZONES"
                currentMs={cacheStats.ttl?.ZONES || 60000}
              />

              <CacheTTLInput
                label="Zone Information Cache TTL"
                cacheKey="ZONE_INFO"
                currentMs={cacheStats.ttl?.ZONE_INFO || 300000}
              />

              <Button
                variant="primary"
                onClick={handleUpdateTTL}
                isLoading={cacheLoading}
              >
                Update TTL Configuration
              </Button>
            </div>
          </div>
        </div>

        {/* Cached Keys */}
        {cacheStats.keys && cacheStats.keys.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Cached Keys ({cacheStats.keys.length})
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="space-y-2">
                {cacheStats.keys.map((key, index) => (
                  <div
                    key={index}
                    className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-white dark:bg-gray-900 px-3 py-2 rounded border border-gray-200 dark:border-gray-700"
                  >
                    {key}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

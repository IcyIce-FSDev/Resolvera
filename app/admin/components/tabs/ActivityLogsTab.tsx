import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { AuditLog } from '@/app/admin/types';
import type { AuditLogFilters } from '@/app/admin/hooks/useAuditLogs';

interface ActivityLogsTabProps {
  auditLogs: AuditLog[];
  totalLogs: number;
  logsLoading: boolean;
  autoRefresh: boolean;
  setAutoRefresh: (enabled: boolean) => void;
  refreshInterval: number;
  showRefreshMenu: boolean;
  setShowRefreshMenu: (show: boolean) => void;
  filters: AuditLogFilters;
  updateFilters: (filters: Partial<AuditLogFilters>) => void;
  clearFilters: () => void;
  loadAuditLogs: () => Promise<void>;
  handleRefreshIntervalChange: (seconds: number) => void;
}

export default function ActivityLogsTab({
  auditLogs,
  totalLogs,
  logsLoading,
  autoRefresh,
  setAutoRefresh,
  refreshInterval,
  showRefreshMenu,
  setShowRefreshMenu,
  filters,
  updateFilters,
  clearFilters,
  loadAuditLogs,
  handleRefreshIntervalChange,
}: ActivityLogsTabProps) {
  const [searchInput, setSearchInput] = useState(filters.keyword || '');
  const [showFilters, setShowFilters] = useState(false);

  const severityColors = {
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ keyword: searchInput || undefined });
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    // datetime-local gives us a string like "2025-01-15T10:30"
    // We need to convert it to a Date object treating it as local time
    if (value) {
      const date = new Date(value);
      updateFilters({ [field]: date });
    } else {
      updateFilters({ [field]: undefined });
    }
  };

  // Convert Date to datetime-local format (YYYY-MM-DDTHH:mm)
  // This preserves the local timezone interpretation
  const dateToLocalInputValue = (date: Date | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    // Format: YYYY-MM-DDTHH:mm
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const hasActiveFilters = filters.keyword || filters.startDate || filters.endDate;

  return (
    <div className="space-y-4">
      <Card
        title="Activity Logs"
        subtitle={totalLogs > 0 ? `${totalLogs} total logs` : undefined}
        headerAction={
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters {hasActiveFilters ? '(active)' : ''}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadAuditLogs()}
            isLoading={logsLoading}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>

          <div className="relative">
            <button
              onClick={() => setShowRefreshMenu(!showRefreshMenu)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span>{autoRefresh ? `Auto (${refreshInterval}s)` : 'Manual'}</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showRefreshMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowRefreshMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        setAutoRefresh(false);
                        setShowRefreshMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded ${
                        !autoRefresh
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      Manual Refresh
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Auto-refresh
                    </div>
                    {[5, 10, 30, 60].map((seconds) => (
                      <button
                        key={seconds}
                        onClick={() => handleRefreshIntervalChange(seconds)}
                        className={`w-full text-left px-3 py-2 text-sm rounded ${
                          autoRefresh && refreshInterval === seconds
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-medium'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        Every {seconds < 60 ? `${seconds} seconds` : `${seconds / 60} minute`}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      }
    >
      {showFilters && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by action, resource, IP, user agent..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button type="submit" size="sm">
                  Search
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  id="startDate"
                  value={dateToLocalInputValue(filters.startDate)}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  id="endDate"
                  value={dateToLocalInputValue(filters.endDate)}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {filters.keyword && <span className="mr-3">Search: "{filters.keyword}"</span>}
                  {filters.startDate && <span className="mr-3">From: {new Date(filters.startDate).toLocaleString()}</span>}
                  {filters.endDate && <span>To: {new Date(filters.endDate).toLocaleString()}</span>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchInput('');
                    clearFilters();
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </form>
        </div>
      )}

      {logsLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading audit logs...</p>
        </div>
      ) : auditLogs.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400">
            No audit logs yet
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${severityColors[log.severity as keyof typeof severityColors]}`}>
                      {log.severity}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${log.status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                      {log.status === 'success' ? 'Success' : 'Failed'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="mb-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {log.action}
                    </span>
                    {log.resource && (
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        on {log.resource}
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      <strong>User:</strong> {log.userName || 'Unknown'}
                    </p>
                    {log.details && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline">
                          View details
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto">
                          {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
    </div>
  );
}

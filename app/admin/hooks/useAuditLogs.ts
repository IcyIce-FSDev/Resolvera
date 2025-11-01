import { useState, useEffect, useRef } from 'react';
import { fetchAuditLogs } from '@/lib/admin/adminApi';
import type { AuditLog } from '@/app/admin/types';

export interface AuditLogFilters {
  keyword?: string;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: string;
  severity?: string;
}

export function useAuditLogs(activeTab: string) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [logsLoading, setLogsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(10); // seconds
  const [showRefreshMenu, setShowRefreshMenu] = useState(false);
  const [filters, setFilters] = useState<AuditLogFilters>({});

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch audit logs when switching to logs tab or filters change
  useEffect(() => {
    if (activeTab === 'logs') {
      loadAuditLogs();
    }
  }, [activeTab, filters]);

  // Auto-refresh audit logs
  useEffect(() => {
    if (autoRefresh && activeTab === 'logs') {
      intervalRef.current = setInterval(() => {
        loadAuditLogs();
      }, refreshInterval * 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [autoRefresh, refreshInterval, activeTab, filters]);

  const loadAuditLogs = async () => {
    setLogsLoading(true);
    const result = await fetchAuditLogs({
      limit: 50,
      ...filters,
    });
    setAuditLogs(result.logs);
    setTotalLogs(result.total);
    setLogsLoading(false);
  };

  const handleRefreshIntervalChange = (seconds: number) => {
    setRefreshInterval(seconds);
    setShowRefreshMenu(false);
  };

  const updateFilters = (newFilters: Partial<AuditLogFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  return {
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
  };
}

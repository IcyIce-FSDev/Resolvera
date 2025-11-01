import { useState, useCallback } from 'react';
import { getSessionAsync } from '@/lib/auth/session';
import { fetchWithAuth } from '@/lib/api/client';

export interface DashboardStats {
  totalZones: number;
  totalRecords: number;
  activeZones: number;
}

export interface Watcher {
  id: string;
  zoneName: string;
  recordName: string;
  recordType: string;
  status: string | null;
  lastChecked: string | null;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  severity: string;
  userId: string | null;
  success?: boolean;
  resource?: string;
  userName?: string;
  userEmail?: string;
}

export interface DNSRecord {
  id: string;
  name: string;
  type: string;
  content: string;
  zoneId: string;
}

export interface UseDashboardDataReturn {
  stats: DashboardStats;
  watchers: Watcher[];
  recentLogs: AuditLog[];
  dnsRecords: DNSRecord[];
  loading: boolean;
  fetchDashboardData: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing dashboard data
 * Consolidates all data fetching logic for the dashboard
 */
export function useDashboardData(): UseDashboardDataReturn {
  const [stats, setStats] = useState<DashboardStats>({
    totalZones: 0,
    totalRecords: 0,
    activeZones: 0,
  });
  const [watchers, setWatchers] = useState<Watcher[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const sessionData = await getSessionAsync();
      const isAdmin = sessionData?.role === 'admin';

      // Fetch zones, records, and watchers for all users
      const promises = [
        fetchWithAuth('/api/zones'),
        fetchWithAuth('/api/dns/records'),
        fetchWithAuth('/api/watchers'),
      ];

      // Only fetch audit logs for admin users
      if (isAdmin) {
        promises.push(fetchWithAuth('/api/admin/audit-logs?limit=5'));
      }

      const responses = await Promise.all(promises);
      const zonesData = await responses[0].json();
      const recordsData = await responses[1].json();
      const watchersData = await responses[2].json();
      const logsData =
        isAdmin && responses[3]
          ? await responses[3].json()
          : { success: false, data: { logs: [] } };

      if (zonesData.success && recordsData.success) {
        const activeZones = zonesData.data.zones.filter(
          (z: any) => z.status === 'active'
        ).length;
        setStats({
          totalZones: zonesData.data.count,
          totalRecords: recordsData.data.count,
          activeZones: activeZones,
        });

        // Filter for A and AAAA records only and limit to 10
        const ipRecords = recordsData.data.records.filter(
          (r: any) => r.type === 'A' || r.type === 'AAAA'
        );
        setDnsRecords(ipRecords.slice(0, 10));
      }

      if (watchersData.success && watchersData.data.watchers) {
        setWatchers(watchersData.data.watchers);
      }

      if (logsData.success && logsData.data.logs) {
        setRecentLogs(logsData.data.logs);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    stats,
    watchers,
    recentLogs,
    dnsRecords,
    loading,
    fetchDashboardData,
  };
}

// Admin API service functions
import { fetchWithAuth } from '@/lib/api/client';
import type {
  User,
  Zone,
  SystemStats,
  WatcherSettings,
  NotificationSettings,
  AuditLog,
  CacheStats,
} from '@/app/admin/types';

/**
 * Fetch all admin data (users, zones, records, watchers, settings)
 */
export async function fetchAdminData() {
  const [usersRes, zonesRes, recordsRes, watchersRes, watcherSettingsRes] = await Promise.all([
    fetchWithAuth('/api/admin/users'),
    fetchWithAuth('/api/zones'),
    fetchWithAuth('/api/dns/records'),
    fetchWithAuth('/api/watchers'),
    fetchWithAuth('/api/admin/watcher-settings'),
  ]);

  const usersData = await usersRes.json();
  const zonesData = await zonesRes.json();
  const recordsData = await recordsRes.json();
  const watchersData = await watchersRes.json();
  const watcherSettingsData = await watcherSettingsRes.json();

  return {
    users: usersData.success ? usersData.data.users : [],
    zones: zonesData.success ? zonesData.data.zones : [],
    watcherSettings: watcherSettingsData.success ? watcherSettingsData.data : null,
    systemStats: {
      totalUsers: usersData.data?.users?.length || 0,
      totalZones: zonesData.data?.count || 0,
      totalRecords: recordsData.data?.records?.length || 0,
      totalWatchers: watchersData.data?.watchers?.length || 0,
    } as SystemStats,
  };
}

/**
 * Fetch notification settings
 */
export async function fetchNotificationSettings(): Promise<NotificationSettings | null> {
  try {
    const response = await fetchWithAuth('/api/admin/notifications');
    const result = await response.json();

    if (result.success && result.data) {
      return {
        dnsRecordAdd: result.data.dnsRecordAdd ?? false,
        dnsRecordEdit: result.data.dnsRecordEdit ?? false,
        dnsRecordDelete: result.data.dnsRecordDelete ?? false,
        watcherAdd: result.data.watcherAdd ?? false,
        watcherEdit: result.data.watcherEdit ?? false,
        watcherDelete: result.data.watcherDelete ?? false,
        watcherIpUpdateManual: result.data.watcherIpUpdateManual ?? false,
        watcherIpUpdateAuto: result.data.watcherIpUpdateAuto ?? false,
        discordWebhookEnabled: result.data.discordWebhookEnabled ?? false,
        discordWebhookUrl: result.data.discordWebhookUrl ?? '',
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return null;
  }
}

/**
 * Save notification settings
 */
export async function saveNotificationSettings(settings: NotificationSettings) {
  const response = await fetchWithAuth('/api/admin/notifications', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to save notification settings');
  }

  return data;
}

/**
 * Fetch audit logs
 */
export async function fetchAuditLogs(params?: {
  limit?: number;
  offset?: number;
  keyword?: string;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: string;
  severity?: string;
}): Promise<{ logs: AuditLog[]; total: number }> {
  try {
    const queryParams = new URLSearchParams();

    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());
    if (params?.keyword) queryParams.set('keyword', params.keyword);
    if (params?.startDate) queryParams.set('startDate', params.startDate.toISOString());
    if (params?.endDate) queryParams.set('endDate', params.endDate.toISOString());
    if (params?.userId) queryParams.set('userId', params.userId);
    if (params?.action) queryParams.set('action', params.action);
    if (params?.severity) queryParams.set('severity', params.severity);

    const response = await fetchWithAuth(`/api/admin/audit-logs?${queryParams.toString()}`);
    const data = await response.json();

    if (data.success) {
      return {
        logs: data.data.logs,
        total: data.data.total,
      };
    }
    return { logs: [], total: 0 };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return { logs: [], total: 0 };
  }
}

/**
 * Fetch cache statistics
 */
export async function fetchCacheStats(): Promise<CacheStats | null> {
  try {
    const response = await fetchWithAuth('/api/admin/cache');
    const data = await response.json();

    if (data.success) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    return null;
  }
}

/**
 * Update cache TTL configuration
 */
export async function updateCacheTTL(ttl: { [key: string]: number }) {
  const response = await fetchWithAuth('/api/admin/cache', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ttl),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to update cache TTL');
  }

  return data;
}

/**
 * Clear all cache
 */
export async function clearCache() {
  const response = await fetchWithAuth('/api/admin/cache', {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to clear cache');
  }

  return data;
}

/**
 * Update watcher settings
 */
export async function updateWatcherSettings(settings: WatcherSettings) {
  const response = await fetchWithAuth('/api/admin/watcher-settings', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to update watcher settings');
  }

  return data;
}

/**
 * Add a new user
 */
export async function addUser(userData: {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  assignedZoneIds: string[];
}) {
  const response = await fetchWithAuth('/api/admin/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to add user');
  }

  return data;
}

/**
 * Update an existing user
 */
export async function updateUser(userId: string, userData: {
  name?: string;
  email?: string;
  role?: 'admin' | 'user';
  assignedZoneIds?: string[];
}) {
  const response = await fetchWithAuth(`/api/admin/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to update user');
  }

  return data;
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string) {
  const response = await fetchWithAuth(`/api/admin/users/${userId}`, {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to delete user');
  }

  return data;
}

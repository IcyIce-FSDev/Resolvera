// Shared types for admin pages

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  assignedZoneIds: string[];
  createdAt: string;
}

export interface Zone {
  zoneName: string;
  zoneId: string;
}

export interface SystemStats {
  totalUsers: number;
  totalZones: number;
  totalRecords: number;
  totalWatchers: number;
}

export interface WatcherSettings {
  enabled: boolean;
  checkInterval: number;
  autoUpdate: boolean;
  notifyOnMismatch: boolean;
}

export interface NotificationSettings {
  dnsRecordAdd: boolean;
  dnsRecordEdit: boolean;
  dnsRecordDelete: boolean;
  watcherAdd: boolean;
  watcherEdit: boolean;
  watcherDelete: boolean;
  watcherIpUpdateManual: boolean;
  watcherIpUpdateAuto: boolean;
  discordWebhookEnabled: boolean;
  discordWebhookUrl: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  status: 'success' | 'failure';
}

export interface CacheStats {
  size: number;
  keys: string[];
  ttl: {
    ZONES: number;
    DNS_RECORDS: number;
    ZONE_INFO: number;
  };
  entries: Array<{
    key: string;
    size: number;
    createdAt: string;
  }>;
}

export interface TTLConfig {
  value: string;
  unit: 'ms' | 'secs' | 'mins' | 'hrs';
}

export interface CacheTTLConfig {
  ZONES: TTLConfig;
  DNS_RECORDS: TTLConfig;
  ZONE_INFO: TTLConfig;
}

export type TabName = 'users' | 'zones' | 'watcher' | 'notifications' | 'logs' | 'cache';

export interface Message {
  type: 'success' | 'error';
  text: string;
}

/**
 * Notification constants and mappings
 */

import type { NotificationPayload } from '../notification';

/**
 * Discord embed colors
 */
export const DISCORD_COLORS = {
  BLUE: 0x3B82F6,
  AMBER: 0xF59E0B,
  RED: 0xEF4444,
  PURPLE: 0x8B5CF6,
  EMERALD: 0x10B981,
} as const;

/**
 * Mapping of notification event types to database settings fields
 */
export const EVENT_TYPE_MAPPING: Record<NotificationPayload['type'], string> = {
  'dns_record_add': 'dnsRecordAdd',
  'dns_record_edit': 'dnsRecordEdit',
  'dns_record_delete': 'dnsRecordDelete',
  'watcher_add': 'watcherAdd',
  'watcher_edit': 'watcherEdit',
  'watcher_delete': 'watcherDelete',
  'watcher_ip_update_manual': 'watcherIpUpdateManual',
  'watcher_ip_update_auto': 'watcherIpUpdateAuto',
} as const;

/**
 * Discord message formatters
 * Formats notification payloads into Discord embed messages
 */

import type { NotificationPayload } from '../notification';
import { DISCORD_COLORS } from './constants';

/**
 * Format notification message for Discord
 */
export function formatDiscordMessage(payload: NotificationPayload): any {
  const timestamp = payload.data.timestamp;

  const messages: Record<NotificationPayload['type'], () => any> = {
    'dns_record_add': () => ({
      embeds: [{
        title: '➕ DNS Record Added',
        color: DISCORD_COLORS.BLUE,
        fields: [
          { name: 'Domain', value: payload.data.domain || 'N/A', inline: true },
          { name: 'Type', value: payload.data.recordType || 'N/A', inline: true },
          { name: 'Content', value: payload.data.content || 'N/A', inline: false },
          { name: 'Time', value: timestamp, inline: false },
        ],
        timestamp: new Date(timestamp).toISOString(),
      }]
    }),
    'dns_record_edit': () => ({
      embeds: [{
        title: '✏️ DNS Record Edited',
        color: DISCORD_COLORS.AMBER,
        fields: [
          { name: 'Domain', value: payload.data.domain || 'N/A', inline: true },
          { name: 'Type', value: payload.data.recordType || 'N/A', inline: true },
          { name: 'Old Content', value: payload.data.oldContent || 'N/A', inline: false },
          { name: 'New Content', value: payload.data.newContent || 'N/A', inline: false },
          { name: 'Time', value: timestamp, inline: false },
        ],
        timestamp: new Date(timestamp).toISOString(),
      }]
    }),
    'dns_record_delete': () => ({
      embeds: [{
        title: '🗑️ DNS Record Deleted',
        color: DISCORD_COLORS.RED,
        fields: [
          { name: 'Domain', value: payload.data.domain || 'N/A', inline: true },
          { name: 'Type', value: payload.data.recordType || 'N/A', inline: true },
          { name: 'Content', value: payload.data.content || 'N/A', inline: false },
          { name: 'Time', value: timestamp, inline: false },
        ],
        timestamp: new Date(timestamp).toISOString(),
      }]
    }),
    'watcher_add': () => ({
      embeds: [{
        title: '👁️ Watcher Added',
        color: DISCORD_COLORS.PURPLE,
        fields: [
          { name: 'Watcher', value: payload.data.watcherName || 'N/A', inline: true },
          { name: 'Record Type', value: payload.data.recordType || 'N/A', inline: true },
          { name: 'Domain', value: payload.data.domain || 'N/A', inline: false },
          { name: 'Time', value: timestamp, inline: false },
        ],
        timestamp: new Date(timestamp).toISOString(),
      }]
    }),
    'watcher_edit': () => ({
      embeds: [{
        title: '✏️ Watcher Edited',
        color: DISCORD_COLORS.PURPLE,
        fields: [
          { name: 'Watcher', value: payload.data.watcherName || 'N/A', inline: true },
          { name: 'Domain', value: payload.data.domain || 'N/A', inline: false },
          { name: 'Time', value: timestamp, inline: false },
        ],
        timestamp: new Date(timestamp).toISOString(),
      }]
    }),
    'watcher_delete': () => ({
      embeds: [{
        title: '🗑️ Watcher Deleted',
        color: DISCORD_COLORS.RED,
        fields: [
          { name: 'Watcher', value: payload.data.watcherName || 'N/A', inline: true },
          { name: 'Domain', value: payload.data.domain || 'N/A', inline: false },
          { name: 'Time', value: timestamp, inline: false },
        ],
        timestamp: new Date(timestamp).toISOString(),
      }]
    }),
    'watcher_ip_update_manual': () => ({
      embeds: [{
        title: '🔄 IP Updated (Manual)',
        color: DISCORD_COLORS.EMERALD,
        fields: [
          { name: 'Domain', value: payload.data.domain || 'N/A', inline: true },
          { name: 'Type', value: payload.data.recordType || 'A', inline: true },
          { name: 'Old IP', value: payload.data.oldIP || 'N/A', inline: true },
          { name: 'New IP', value: payload.data.newIP || 'N/A', inline: true },
          { name: 'Updated by', value: payload.data.updatedBy || 'User', inline: false },
          { name: 'Time', value: timestamp, inline: false },
        ],
        timestamp: new Date(timestamp).toISOString(),
      }]
    }),
    'watcher_ip_update_auto': () => ({
      embeds: [{
        title: '🔄 IP Updated (Auto)',
        color: DISCORD_COLORS.AMBER,
        fields: [
          { name: 'Domain', value: payload.data.domain || 'N/A', inline: true },
          { name: 'Type', value: payload.data.recordType || 'A', inline: true },
          { name: 'Old IP', value: payload.data.oldIP || 'N/A', inline: true },
          { name: 'New IP', value: payload.data.newIP || 'N/A', inline: true },
          { name: 'Updated by', value: 'Watcher (Auto)', inline: false },
          { name: 'Time', value: timestamp, inline: false },
        ],
        timestamp: new Date(timestamp).toISOString(),
      }]
    }),
  };

  return messages[payload.type]();
}

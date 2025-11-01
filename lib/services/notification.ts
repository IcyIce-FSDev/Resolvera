/**
 * Notification Service
 * Handles sending notifications via various channels (Discord, etc.)
 */

import { prisma } from '@/lib/db/prisma';
import { EVENT_TYPE_MAPPING } from './notification/constants';
import { sendDiscordNotification } from './notification/discord-client';

export interface NotificationPayload {
  type: 'dns_record_add' | 'dns_record_edit' | 'dns_record_delete' |
        'watcher_add' | 'watcher_edit' | 'watcher_delete' |
        'watcher_ip_update_manual' | 'watcher_ip_update_auto';
  data: {
    domain?: string;
    recordType?: string;
    content?: string;
    oldContent?: string;
    newContent?: string;
    oldIP?: string;
    newIP?: string;
    watcherName?: string;
    updatedBy?: string;
    timestamp: string;
    [key: string]: any;
  };
}

/**
 * Check if notifications are enabled for a specific event type
 */
export async function isNotificationEnabled(eventType: NotificationPayload['type']): Promise<boolean> {
  try {
    const settings = await prisma.notificationSettings.findFirst();

    if (!settings) {
      return false;
    }

    return settings[EVENT_TYPE_MAPPING[eventType] as keyof typeof settings] as boolean;
  } catch (error) {
    console.error('[NOTIFICATION] Error checking if notification is enabled:', error);
    return false;
  }
}

/**
 * Send notification based on configured settings
 */
export async function sendNotification(payload: NotificationPayload): Promise<void> {
  try {
    // Check if this event type should trigger a notification
    const enabled = await isNotificationEnabled(payload.type);
    if (!enabled) {
      console.log(`[NOTIFICATION] Skipping notification for ${payload.type} - disabled in settings`);
      return;
    }

    // Get notification settings
    const settings = await prisma.notificationSettings.findFirst();
    if (!settings) {
      console.log('[NOTIFICATION] No notification settings found');
      return;
    }

    // Send Discord notification if enabled
    if (settings.discordWebhookEnabled && settings.discordWebhookUrl) {
      await sendDiscordNotification(settings.discordWebhookUrl, payload);
    }
  } catch (error) {
    console.error('[NOTIFICATION] Error in sendNotification:', error);
    // Don't throw - we don't want notification failures to break the main operation
  }
}

/**
 * Discord webhook client
 * Handles sending messages to Discord webhooks
 */

import type { NotificationPayload } from '../notification';
import { formatDiscordMessage } from './discord-formatters';

/**
 * Send Discord webhook notification
 *
 * @param webhookUrl - Discord webhook URL
 * @param payload - Notification payload
 *
 * @example
 * ```typescript
 * await sendDiscordNotification(
 *   'https://discord.com/api/webhooks/...',
 *   { type: 'dns_record_add', data: { domain: 'example.com', ... } }
 * );
 * ```
 */
export async function sendDiscordNotification(
  webhookUrl: string,
  payload: NotificationPayload
): Promise<void> {
  try {
    const message = formatDiscordMessage(payload);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Discord webhook failed: ${response.status} ${errorText}`);
    }

    console.log(`[NOTIFICATION] Discord notification sent for ${payload.type}`);
  } catch (error) {
    console.error('[NOTIFICATION] Error sending Discord notification:', error);
    throw error;
  }
}

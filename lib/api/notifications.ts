import { sendNotification } from '@/lib/services/notification';

/**
 * DNS notification types
 */
export type DNSNotificationType =
  | 'dns_record_add'
  | 'dns_record_edit'
  | 'dns_record_delete'
  | 'watcher_ip_update_manual';

/**
 * DNS record notification data
 */
export interface DNSRecordNotificationData {
  domain: string;
  recordType: string;
  content?: string;
  oldContent?: string;
  newContent?: string;
  oldIP?: string;
  newIP?: string;
  updatedBy?: string;
  timestamp?: string;
}

/**
 * Send a DNS record notification
 * Wrapper around sendNotification for DNS operations
 *
 * @param type - The notification type
 * @param data - The DNS record data
 *
 * @example
 * ```typescript
 * // Notify about DNS record creation
 * await sendDNSNotification('dns_record_add', {
 *   domain: 'example.com',
 *   recordType: 'A',
 *   content: '1.2.3.4'
 * });
 *
 * // Notify about DNS record update
 * await sendDNSNotification('dns_record_edit', {
 *   domain: 'www.example.com',
 *   recordType: 'A',
 *   oldContent: '1.2.3.4',
 *   newContent: '5.6.7.8'
 * });
 * ```
 */
export async function sendDNSNotification(
  type: DNSNotificationType,
  data: DNSRecordNotificationData
): Promise<void> {
  const timestamp = data.timestamp || new Date().toISOString();

  const notificationData: any = {
    domain: data.domain,
    recordType: data.recordType,
    timestamp,
  };

  // Add type-specific fields
  switch (type) {
    case 'dns_record_add':
      notificationData.content = data.content || 'N/A';
      break;

    case 'dns_record_edit':
      notificationData.oldContent = data.oldContent || 'N/A';
      notificationData.newContent = data.newContent || data.content || 'N/A';
      break;

    case 'dns_record_delete':
      notificationData.content = data.content || 'N/A';
      break;

    case 'watcher_ip_update_manual':
      notificationData.oldIP = data.oldIP || 'N/A';
      notificationData.newIP = data.newIP || data.content || 'N/A';
      notificationData.updatedBy = data.updatedBy || 'User';
      break;
  }

  await sendNotification({
    type,
    data: notificationData,
  });
}

/**
 * Send a DNS record add notification
 *
 * @param domain - The domain name
 * @param recordType - The DNS record type
 * @param content - The record content
 *
 * @example
 * ```typescript
 * await notifyDNSRecordAdd('example.com', 'A', '1.2.3.4');
 * ```
 */
export async function notifyDNSRecordAdd(
  domain: string,
  recordType: string,
  content: string
): Promise<void> {
  await sendDNSNotification('dns_record_add', {
    domain,
    recordType,
    content,
  });
}

/**
 * Send a DNS record edit notification
 *
 * @param domain - The domain name
 * @param recordType - The DNS record type
 * @param oldContent - The old record content
 * @param newContent - The new record content
 * @param updatedBy - Optional user who made the update
 *
 * @example
 * ```typescript
 * await notifyDNSRecordEdit('example.com', 'A', '1.2.3.4', '5.6.7.8', 'admin@example.com');
 * ```
 */
export async function notifyDNSRecordEdit(
  domain: string,
  recordType: string,
  oldContent: string,
  newContent: string,
  updatedBy?: string
): Promise<void> {
  const isIPRecord = recordType === 'A' || recordType === 'AAAA';

  if (isIPRecord && updatedBy) {
    // Manual IP update on watched record
    await sendDNSNotification('watcher_ip_update_manual', {
      domain,
      recordType,
      oldIP: oldContent,
      newIP: newContent,
      updatedBy,
    });
  } else {
    // Regular DNS record edit
    await sendDNSNotification('dns_record_edit', {
      domain,
      recordType,
      oldContent,
      newContent,
    });
  }
}

/**
 * Send a DNS record delete notification
 *
 * @param domain - The domain name
 * @param recordType - The DNS record type
 * @param content - The record content
 *
 * @example
 * ```typescript
 * await notifyDNSRecordDelete('example.com', 'A', '1.2.3.4');
 * ```
 */
export async function notifyDNSRecordDelete(
  domain: string,
  recordType: string,
  content: string
): Promise<void> {
  await sendDNSNotification('dns_record_delete', {
    domain,
    recordType,
    content,
  });
}

/**
 * Watcher notification types
 */
export type WatcherNotificationType =
  | 'watcher_add'
  | 'watcher_edit'
  | 'watcher_delete'
  | 'watcher_ip_update_auto';

/**
 * Send a watcher notification
 *
 * @param type - The notification type
 * @param data - The watcher notification data
 *
 * @example
 * ```typescript
 * await sendWatcherNotification('watcher_ip_update_auto', {
 *   domain: 'example.com',
 *   recordType: 'A',
 *   expectedIP: '1.2.3.4',
 *   actualIP: '5.6.7.8'
 * });
 * ```
 */
export async function sendWatcherNotification(
  type: WatcherNotificationType,
  data: Record<string, any>
): Promise<void> {
  await sendNotification({
    type,
    data: {
      timestamp: new Date().toISOString(),
      ...data,
    },
  });
}

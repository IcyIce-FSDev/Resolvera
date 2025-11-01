import { useState, useEffect } from 'react';
import { fetchNotificationSettings, saveNotificationSettings } from '@/lib/admin/adminApi';
import type { NotificationSettings, Message } from '@/app/admin/types';

export function useNotificationSettings(activeTab: string) {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    dnsRecordAdd: false,
    dnsRecordEdit: false,
    dnsRecordDelete: false,
    watcherAdd: false,
    watcherEdit: false,
    watcherDelete: false,
    watcherIpUpdateManual: false,
    watcherIpUpdateAuto: false,
    discordWebhookEnabled: false,
    discordWebhookUrl: '',
  });

  const [dnsEventsExpanded, setDnsEventsExpanded] = useState(false);
  const [watcherEventsExpanded, setWatcherEventsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch notification settings when switching to notifications tab
  useEffect(() => {
    if (activeTab === 'notifications') {
      loadNotificationSettings();
    }
  }, [activeTab]);

  const loadNotificationSettings = async () => {
    const settings = await fetchNotificationSettings();
    if (settings) {
      setNotificationSettings(settings);
    }
  };

  const handleSaveNotificationSettings = async (): Promise<Message | null> => {
    setIsSubmitting(true);

    try {
      await saveNotificationSettings(notificationSettings);
      return { type: 'success', text: 'Notification settings saved successfully' };
    } catch (error: any) {
      return { type: 'error', text: error.message || 'Failed to save notification settings' };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    notificationSettings,
    setNotificationSettings,
    dnsEventsExpanded,
    setDnsEventsExpanded,
    watcherEventsExpanded,
    setWatcherEventsExpanded,
    isSubmitting,
    handleSaveNotificationSettings,
  };
}

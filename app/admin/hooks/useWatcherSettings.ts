import { useState, useEffect } from 'react';
import { updateWatcherSettings } from '@/lib/admin/adminApi';
import type { WatcherSettings, Message } from '@/app/admin/types';

export function useWatcherSettings(initialSettings: WatcherSettings) {
  const [watcherSettings, setWatcherSettings] = useState<WatcherSettings>(initialSettings);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync with external updates to initialSettings
  useEffect(() => {
    setWatcherSettings(initialSettings);
  }, [initialSettings]);

  const handleUpdateWatcherSettings = async (field: string, value: any): Promise<Message | null> => {
    setIsSubmitting(true);

    try {
      const updatedSettings = { ...watcherSettings, [field]: value };
      await updateWatcherSettings(updatedSettings);

      setWatcherSettings(updatedSettings);
      return { type: 'success', text: 'Watcher settings updated successfully' };
    } catch (error: any) {
      return { type: 'error', text: error.message || 'Failed to update settings' };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    watcherSettings,
    setWatcherSettings,
    isSubmitting,
    handleUpdateWatcherSettings,
  };
}

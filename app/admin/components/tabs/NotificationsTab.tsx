import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ToggleSwitch from '@/app/admin/components/ui/ToggleSwitch';
import CollapsibleSection from '@/app/admin/components/ui/CollapsibleSection';
import type { NotificationSettings } from '@/app/admin/types';

interface NotificationsTabProps {
  notificationSettings: NotificationSettings;
  setNotificationSettings: (settings: NotificationSettings) => void;
  dnsEventsExpanded: boolean;
  setDnsEventsExpanded: (expanded: boolean) => void;
  watcherEventsExpanded: boolean;
  setWatcherEventsExpanded: (expanded: boolean) => void;
  handleSaveNotificationSettings: () => Promise<void>;
  isSubmitting: boolean;
}

export default function NotificationsTab({
  notificationSettings,
  setNotificationSettings,
  dnsEventsExpanded,
  setDnsEventsExpanded,
  watcherEventsExpanded,
  setWatcherEventsExpanded,
  handleSaveNotificationSettings,
  isSubmitting,
}: NotificationsTabProps) {
  const [discordExpanded, setDiscordExpanded] = React.useState(notificationSettings.discordWebhookEnabled);

  // Sync discord expanded state with enabled state
  React.useEffect(() => {
    setDiscordExpanded(notificationSettings.discordWebhookEnabled);
  }, [notificationSettings.discordWebhookEnabled]);

  return (
    <div className="space-y-6">
      {/* Discord Notifications Section */}
      <Card title="Notification Settings">
        <div className="space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure Discord webhook notifications for your system events
          </p>

          {/* Discord Master Toggle */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDiscordExpanded(!discordExpanded)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  disabled={!notificationSettings.discordWebhookEnabled}
                >
                  <svg className={`w-5 h-5 transition-transform ${discordExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Discord Webhook</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {notificationSettings.discordWebhookEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.discordWebhookEnabled}
                  onChange={(e) => {
                    setNotificationSettings({ ...notificationSettings, discordWebhookEnabled: e.target.checked });
                    if (e.target.checked) {
                      setDiscordExpanded(true);
                    }
                  }}
                  className="sr-only peer"
                  disabled={isSubmitting}
                />
                <span className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer-checked:bg-indigo-500 dark:peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white"></span>
              </label>
            </div>

            {/* Discord Configuration - Only show when enabled and expanded */}
            {notificationSettings.discordWebhookEnabled && discordExpanded && (
              <div className="space-y-6 ml-8 pt-3 border-t border-gray-200 dark:border-gray-600">
                {/* Webhook URL Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={notificationSettings.discordWebhookUrl}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, discordWebhookUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Get this from your Discord server settings → Integrations → Webhooks
                  </p>
                </div>

                {/* DNS Record Events - Sub-section */}
                <CollapsibleSection
                  title="DNS Record Events"
                  subtitle={
                    notificationSettings.dnsRecordAdd || notificationSettings.dnsRecordEdit || notificationSettings.dnsRecordDelete
                      ? 'Some notifications enabled'
                      : 'No notifications enabled'
                  }
                  isExpanded={dnsEventsExpanded}
                  onToggle={() => setDnsEventsExpanded(!dnsEventsExpanded)}
                  masterChecked={notificationSettings.dnsRecordAdd || notificationSettings.dnsRecordEdit || notificationSettings.dnsRecordDelete}
                  onMasterChange={(enabled) => {
                    setNotificationSettings({
                      ...notificationSettings,
                      dnsRecordAdd: enabled,
                      dnsRecordEdit: enabled,
                      dnsRecordDelete: enabled,
                    });
                  }}
                  disabled={isSubmitting}
                >
                  <ToggleSwitch
                    checked={notificationSettings.dnsRecordAdd}
                    onChange={(checked) => setNotificationSettings({ ...notificationSettings, dnsRecordAdd: checked })}
                    label="Add Record"
                    description="Notify when a new DNS record is created"
                    disabled={isSubmitting}
                    color="blue"
                  />
                  <ToggleSwitch
                    checked={notificationSettings.dnsRecordEdit}
                    onChange={(checked) => setNotificationSettings({ ...notificationSettings, dnsRecordEdit: checked })}
                    label="Edit Record"
                    description="Notify when a DNS record is modified"
                    disabled={isSubmitting}
                    color="blue"
                  />
                  <ToggleSwitch
                    checked={notificationSettings.dnsRecordDelete}
                    onChange={(checked) => setNotificationSettings({ ...notificationSettings, dnsRecordDelete: checked })}
                    label="Delete Record"
                    description="Notify when a DNS record is deleted"
                    disabled={isSubmitting}
                    color="blue"
                  />
                </CollapsibleSection>

                {/* Watcher Events - Sub-section */}
                <CollapsibleSection
                  title="Watcher Events"
                  subtitle={
                    notificationSettings.watcherAdd ||
                    notificationSettings.watcherEdit ||
                    notificationSettings.watcherDelete ||
                    notificationSettings.watcherIpUpdateManual ||
                    notificationSettings.watcherIpUpdateAuto
                      ? 'Some notifications enabled'
                      : 'No notifications enabled'
                  }
                  isExpanded={watcherEventsExpanded}
                  onToggle={() => setWatcherEventsExpanded(!watcherEventsExpanded)}
                  masterChecked={
                    notificationSettings.watcherAdd ||
                    notificationSettings.watcherEdit ||
                    notificationSettings.watcherDelete ||
                    notificationSettings.watcherIpUpdateManual ||
                    notificationSettings.watcherIpUpdateAuto
                  }
                  onMasterChange={(enabled) => {
                    setNotificationSettings({
                      ...notificationSettings,
                      watcherAdd: enabled,
                      watcherEdit: enabled,
                      watcherDelete: enabled,
                      watcherIpUpdateManual: enabled,
                      watcherIpUpdateAuto: enabled,
                    });
                  }}
                  disabled={isSubmitting}
                >
                  <ToggleSwitch
                    checked={notificationSettings.watcherAdd}
                    onChange={(checked) => setNotificationSettings({ ...notificationSettings, watcherAdd: checked })}
                    label="Add Watcher"
                    description="Notify when a new watcher is created"
                    disabled={isSubmitting}
                    color="purple"
                  />
                  <ToggleSwitch
                    checked={notificationSettings.watcherEdit}
                    onChange={(checked) => setNotificationSettings({ ...notificationSettings, watcherEdit: checked })}
                    label="Edit Watcher"
                    description="Notify when a watcher is modified"
                    disabled={isSubmitting}
                    color="purple"
                  />
                  <ToggleSwitch
                    checked={notificationSettings.watcherDelete}
                    onChange={(checked) => setNotificationSettings({ ...notificationSettings, watcherDelete: checked })}
                    label="Delete Watcher"
                    description="Notify when a watcher is deleted"
                    disabled={isSubmitting}
                    color="purple"
                  />
                  <ToggleSwitch
                    checked={notificationSettings.watcherIpUpdateManual}
                    onChange={(checked) => setNotificationSettings({ ...notificationSettings, watcherIpUpdateManual: checked })}
                    label="IP Update (Manual)"
                    description="Notify when IP is manually updated"
                    disabled={isSubmitting}
                    color="emerald"
                  />
                  <ToggleSwitch
                    checked={notificationSettings.watcherIpUpdateAuto}
                    onChange={(checked) => setNotificationSettings({ ...notificationSettings, watcherIpUpdateAuto: checked })}
                    label="IP Update (Auto by Watcher)"
                    description="Notify when IP is automatically updated by watcher"
                    disabled={isSubmitting}
                    color="amber"
                  />
                </CollapsibleSection>
              </div>
            )}
          </div>

          <Button
            variant="primary"
            onClick={handleSaveNotificationSettings}
            isLoading={isSubmitting}
          >
            Save Notification Settings
          </Button>
        </div>
      </Card>
    </div>
  );
}

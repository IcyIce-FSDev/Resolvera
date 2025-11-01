import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { WatcherSettings, NotificationSettings, TabName } from '@/app/admin/types';

interface WatcherSettingsTabProps {
  watcherSettings: WatcherSettings;
  setWatcherSettings: (settings: WatcherSettings) => void;
  notificationSettings: NotificationSettings;
  handleUpdateWatcherSettings: (field: string, value: any) => Promise<void>;
  setActiveTab: (tab: TabName) => void;
  isSubmitting: boolean;
}

export default function WatcherSettingsTab({
  watcherSettings,
  setWatcherSettings,
  notificationSettings,
  handleUpdateWatcherSettings,
  setActiveTab,
  isSubmitting,
}: WatcherSettingsTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card title="Watcher Settings">
        <div className="space-y-6">
          {/* Enable/Disable Watcher */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Enable Watcher</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically check DNS records against server IP
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={watcherSettings.enabled}
                onChange={(e) => handleUpdateWatcherSettings('enabled', e.target.checked)}
                className="sr-only peer"
                disabled={isSubmitting}
              />
              <span className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white"></span>
            </label>
          </div>

          {/* Check Interval */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Check Interval</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              How often to check DNS records (in minutes)
            </p>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="1"
                max="1440"
                value={watcherSettings.checkInterval}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 1 && value <= 1440) {
                    setWatcherSettings({ ...watcherSettings, checkInterval: value });
                  }
                }}
                onBlur={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 1 && value <= 1440) {
                    handleUpdateWatcherSettings('checkInterval', value);
                  }
                }}
                className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={isSubmitting}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">minutes</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Recommended: 5-60 minutes (1-1440 allowed)
            </p>
          </div>

          {/* Auto Update */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Auto-Update DNS Records</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically update DNS records when IP mismatch is detected
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                ⚠️ Use with caution - this will modify DNS records automatically
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={watcherSettings.autoUpdate}
                onChange={(e) => {
                  if (e.target.checked) {
                    if (confirm('Are you sure you want to enable auto-update? This will automatically modify DNS records when mismatches are detected.')) {
                      handleUpdateWatcherSettings('autoUpdate', true);
                    }
                  } else {
                    handleUpdateWatcherSettings('autoUpdate', false);
                  }
                }}
                className="sr-only peer"
                disabled={isSubmitting}
              />
              <span className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer-checked:bg-amber-500 dark:peer-checked:bg-amber-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white"></span>
            </label>
          </div>
        </div>
      </Card>

      {/* Notifications Settings Card */}
      <Card title="Notifications">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Quick access to notification settings
          </p>

          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Configure detailed notification triggers and methods in the <strong>Notifications</strong> tab.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveTab('notifications')}
            >
              Go to Notifications Settings
            </Button>
          </div>

          {/* Quick Discord Status */}
          {notificationSettings.discordWebhookEnabled && notificationSettings.discordWebhookUrl && (
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 mt-1.5 bg-indigo-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                    Discord Webhook Active
                  </p>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
                    Notifications will be sent to your Discord server
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

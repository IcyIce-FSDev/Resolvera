import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { type PreferencesData } from '../hooks/usePreferences';

interface SettingsPreferencesTabProps {
  preferences: PreferencesData;
  isDarkMode: boolean;
  onAutoRefreshChange: (value: number) => void;
  onNotificationsChange: (value: boolean) => void;
  onThemeToggle: () => void;
  onSave: () => void;
}

export default function SettingsPreferencesTab({
  preferences,
  isDarkMode,
  onAutoRefreshChange,
  onNotificationsChange,
  onThemeToggle,
  onSave,
}: SettingsPreferencesTabProps) {
  return (
    <Card title="Application Preferences">
      <div className="space-y-6">
        {/* Theme Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Theme
          </label>
          <div className="grid grid-cols-2 gap-4">
            {/* Light Mode Button */}
            <button
              type="button"
              onClick={() => {
                if (isDarkMode) {
                  onThemeToggle();
                }
              }}
              className={`
                relative p-6 rounded-lg transition-all duration-200
                ${!isDarkMode
                  ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-400 shadow-lg shadow-amber-200/50 dark:shadow-amber-400/25'
                  : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600'
                }
              `}
            >
              <div className="flex flex-col items-center space-y-3">
                <svg className={`w-8 h-8 ${!isDarkMode ? 'text-amber-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
                <span className={`font-medium ${!isDarkMode ? 'text-amber-700' : 'text-gray-600 dark:text-gray-400'}`}>
                  Light Mode
                </span>
                {!isDarkMode && (
                  <span className="absolute top-2 right-2">
                    <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
            </button>

            {/* Dark Mode Button */}
            <button
              type="button"
              onClick={() => {
                if (!isDarkMode) {
                  onThemeToggle();
                }
              }}
              className={`
                relative p-6 rounded-lg transition-all duration-200
                ${isDarkMode
                  ? 'bg-gradient-to-br from-indigo-900 to-purple-900 border-2 border-indigo-500 shadow-lg shadow-indigo-500/50'
                  : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600'
                }
              `}
            >
              <div className="flex flex-col items-center space-y-3">
                <svg className={`w-8 h-8 ${isDarkMode ? 'text-indigo-300' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
                <span className={`font-medium ${isDarkMode ? 'text-indigo-200' : 'text-gray-600 dark:text-gray-400'}`}>
                  Dark Mode
                </span>
                {isDarkMode && (
                  <span className="absolute top-2 right-2">
                    <svg className="w-5 h-5 text-indigo-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Auto Refresh Interval */}
        <Input
          label="Auto Refresh Interval (seconds)"
          type="number"
          min="30"
          max="300"
          value={preferences.autoRefreshInterval}
          onChange={(e) => onAutoRefreshChange(parseInt(e.target.value))}
          hint="How often to refresh data on the dashboard (30-300 seconds)"
        />

        {/* Enable Notifications */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preferences.enableNotifications}
              onChange={(e) => onNotificationsChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable Notifications
            </span>
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
            Show notifications for watcher alerts and updates
          </p>
        </div>

        {/* Save Button */}
        <Button onClick={onSave}>
          Save Preferences
        </Button>
      </div>
    </Card>
  );
}

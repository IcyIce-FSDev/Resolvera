'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getSessionAsync, type Session } from '@/lib/auth/session';
import { logout } from '@/lib/auth/logout';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useAccountSettings } from './hooks/useAccountSettings';
import { usePreferences } from './hooks/usePreferences';
import PageLayout from '@/components/layout/PageLayout';
import Alert from '@/components/ui/Alert';
import SettingsAccountTab from './components/SettingsAccountTab';
import SettingsPreferencesTab from './components/SettingsPreferencesTab';

export default function SettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { isDarkMode, toggleDarkMode: toggleDarkModeHook } = useDarkMode();
  const [activeTab, setActiveTab] = useState('account');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize account settings hook
  const {
    accountForm,
    setAccountForm,
    passwordForm,
    setPasswordForm,
    isSubmitting,
    handleUpdateAccount,
    handleUpdatePassword,
  } = useAccountSettings();

  // Initialize preferences hook
  const {
    preferences,
    setAutoRefreshInterval,
    setEnableNotifications,
    savePreferences,
  } = usePreferences();

  useEffect(() => {
    async function initialize() {
      if (!(await isAuthenticated())) {
        router.push('/');
        return;
      }

      const sessionData = await getSessionAsync();
      setSession(sessionData);

      // Set initial account form values
      setAccountForm({
        name: sessionData?.name || '',
        email: sessionData?.email || '',
      });

      setLoading(false);
    }

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); // Only run on mount and when router changes

  const toggleDarkMode = () => {
    toggleDarkModeHook();
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Wrapper handlers for account tab
  const handleAccountUpdate = async (e: React.FormEvent) => {
    const result = await handleUpdateAccount(e, session, setSession);
    if (result) setMessage(result);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    const result = await handleUpdatePassword(e, session?.email);
    if (result) setMessage(result);
  };

  const handleAccountFieldChange = (field: 'name' | 'email', value: string) => {
    setAccountForm({ ...accountForm, [field]: value });
  };

  const handlePasswordFieldChange = (field: 'currentPassword' | 'newPassword' | 'confirmPassword', value: string) => {
    setPasswordForm({ ...passwordForm, [field]: value });
  };

  // Wrapper handler for preferences tab
  const handlePreferencesSave = () => {
    const result = savePreferences();
    setMessage(result);
  };

  if (loading) {
    return (
      <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <PageLayout
      currentPage="settings"
      session={session}
      isDarkMode={isDarkMode}
      onToggleDarkMode={toggleDarkMode}
      onLogout={handleLogout}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage your account and preferences
        </p>
      </div>

      {message && (
        <div className="mb-6">
          <Alert
            type={message.type}
            message={message.text}
            onClose={() => setMessage(null)}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-8 -mb-px">
            <button
              onClick={() => setActiveTab('account')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'account'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Account
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'preferences'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Preferences
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'account' && (
        <SettingsAccountTab
          accountForm={accountForm}
          passwordForm={passwordForm}
          isSubmitting={isSubmitting}
          onAccountChange={handleAccountFieldChange}
          onPasswordChange={handlePasswordFieldChange}
          onUpdateAccount={handleAccountUpdate}
          onUpdatePassword={handlePasswordUpdate}
        />
      )}

      {activeTab === 'preferences' && (
        <SettingsPreferencesTab
          preferences={preferences}
          isDarkMode={isDarkMode}
          onAutoRefreshChange={setAutoRefreshInterval}
          onNotificationsChange={setEnableNotifications}
          onThemeToggle={toggleDarkMode}
          onSave={handlePreferencesSave}
        />
      )}
    </PageLayout>
  );
}

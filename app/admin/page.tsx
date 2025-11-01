'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getSessionAsync, type Session } from '@/lib/auth/session';
import { logout } from '@/lib/auth/logout';
import { useDarkMode } from '@/hooks/useDarkMode';
import PageLayout from '@/components/layout/PageLayout';
import Toast from '@/components/ui/Toast';
import StatsCard from '@/components/ui/StatsCard';

// Import types
import type { User, Zone, SystemStats, TabName, Message } from '@/app/admin/types';

// Import custom hooks
import { useUserManagement } from '@/app/admin/hooks/useUserManagement';
import { useZones } from '@/app/admin/hooks/useZones';
import { useNotificationSettings } from '@/app/admin/hooks/useNotificationSettings';
import { useCacheSettings } from '@/app/admin/hooks/useCacheSettings';
import { useAuditLogs } from '@/app/admin/hooks/useAuditLogs';
import { useWatcherSettings } from '@/app/admin/hooks/useWatcherSettings';

// Import tab components
import UserManagementTab from '@/app/admin/components/tabs/UserManagementTab';
import ZonesTab from '@/app/admin/components/tabs/ZonesTab';
import WatcherSettingsTab from '@/app/admin/components/tabs/WatcherSettingsTab';
import NotificationsTab from '@/app/admin/components/tabs/NotificationsTab';
import ActivityLogsTab from '@/app/admin/components/tabs/ActivityLogsTab';
import CacheSettingsTab from '@/app/admin/components/tabs/CacheSettingsTab';

// Import API functions
import { fetchAdminData } from '@/lib/admin/adminApi';

export default function AdminPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [activeTab, setActiveTab] = useState<TabName>('users');
  const [message, setMessage] = useState<Message | null>(null);

  // Core data
  const [users, setUsers] = useState<User[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    totalZones: 0,
    totalRecords: 0,
    totalWatchers: 0,
  });

  const [initialWatcherSettings, setInitialWatcherSettings] = useState({
    enabled: true,
    checkInterval: 5,
    autoUpdate: false,
    notifyOnMismatch: true,
  });

  // Fetch all admin data
  const fetchData = useCallback(async () => {
    try {
      const data = await fetchAdminData();
      setUsers(data.users);
      setZones(data.zones);
      setSystemStats(data.systemStats);
      if (data.watcherSettings) {
        setInitialWatcherSettings(data.watcherSettings);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  }, []);

  // Initialize custom hooks
  const userManagement = useUserManagement(fetchData);
  const zonesHook = useZones(activeTab);
  const notificationSettings = useNotificationSettings(activeTab);
  const cacheSettings = useCacheSettings(activeTab);
  const auditLogsHook = useAuditLogs(activeTab);
  const watcherSettings = useWatcherSettings(initialWatcherSettings);

  // Initialize app
  useEffect(() => {
    async function initialize() {
      if (!(await isAuthenticated())) {
        router.push('/');
        return;
      }

      const sessionData = await getSessionAsync();
      setSession(sessionData);

      // Fetch data
      await fetchData();
      setLoading(false);
    }

    initialize();
  }, [router, fetchData]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Wrapper functions for hooks that return messages
  const handleAddUser = async (e: React.FormEvent) => {
    const result = await userManagement.handleAddUser(e);
    if (result) setMessage(result);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    const result = await userManagement.handleUpdateUser(e);
    if (result) setMessage(result);
  };

  const handleDeleteUser = async (userId: string) => {
    const result = await userManagement.handleDeleteUser(userId);
    if (result) setMessage(result);
  };

  const handleSaveNotificationSettings = async () => {
    const result = await notificationSettings.handleSaveNotificationSettings();
    if (result) setMessage(result);
  };

  const handleUpdateTTL = async () => {
    const result = await cacheSettings.handleUpdateTTL();
    if (result) setMessage(result);
  };

  const handleClearCache = async () => {
    const result = await cacheSettings.handleClearCache();
    if (result) setMessage(result);
  };

  const handleUpdateWatcherSettings = async (field: string, value: any) => {
    const result = await watcherSettings.handleUpdateWatcherSettings(field, value);
    if (result) setMessage(result);
  };

  const handleAddZone = async (e: React.FormEvent) => {
    const result = await zonesHook.handleAddZone(e);
    if (result) setMessage(result);
  };

  const handleDeleteZone = async (zoneId: string) => {
    const result = await zonesHook.handleDeleteZone(zoneId);
    if (result) setMessage(result);
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
      currentPage="admin"
      session={session}
      isDarkMode={isDarkMode}
      onToggleDarkMode={toggleDarkMode}
      onLogout={handleLogout}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Administration</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage users, settings, and system configuration
        </p>
      </div>

      {/* Toast Notifications */}
      {message && (
        <Toast
          type={message.type === 'success' ? 'success' : 'error'}
          message={message.text}
          onClose={() => setMessage(null)}
          autoClose={message.type === 'success'}
        />
      )}

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Users"
          value={systemStats.totalUsers}
          iconBgColor="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Total Zones"
          value={systemStats.totalZones}
          iconBgColor="bg-green-100 dark:bg-green-900/30"
          iconColor="text-green-600 dark:text-green-400"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          }
        />
        <StatsCard
          title="DNS Records"
          value={systemStats.totalRecords}
          iconBgColor="bg-purple-100 dark:bg-purple-900/30"
          iconColor="text-purple-600 dark:text-purple-400"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatsCard
          title="Active Watchers"
          value={systemStats.totalWatchers}
          iconBgColor="bg-orange-100 dark:bg-orange-900/30"
          iconColor="text-orange-600 dark:text-orange-400"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        />
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-8 -mb-px">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('zones')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'zones'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Zones
            </button>
            <button
              onClick={() => setActiveTab('watcher')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'watcher'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Watcher Settings
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'notifications'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'logs'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Activity Logs
            </button>
            <button
              onClick={() => setActiveTab('cache')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'cache'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Cache Settings
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'users' && (
        <UserManagementTab
          users={users}
          zones={zones}
          sessionUserId={session?.userId}
          {...userManagement}
          handleAddUser={handleAddUser}
          handleUpdateUser={handleUpdateUser}
          handleDeleteUser={handleDeleteUser}
        />
      )}

      {activeTab === 'zones' && (
        <ZonesTab
          {...zonesHook}
          handleAddZone={handleAddZone}
          handleDeleteZone={handleDeleteZone}
        />
      )}

      {activeTab === 'watcher' && (
        <WatcherSettingsTab
          {...watcherSettings}
          notificationSettings={notificationSettings.notificationSettings}
          handleUpdateWatcherSettings={handleUpdateWatcherSettings}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 'notifications' && (
        <NotificationsTab
          {...notificationSettings}
          handleSaveNotificationSettings={handleSaveNotificationSettings}
        />
      )}

      {activeTab === 'logs' && (
        <ActivityLogsTab {...auditLogsHook} />
      )}

      {activeTab === 'cache' && (
        <CacheSettingsTab
          {...cacheSettings}
          handleUpdateTTL={handleUpdateTTL}
          handleClearCache={handleClearCache}
        />
      )}
    </PageLayout>
  );
}

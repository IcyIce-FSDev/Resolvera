'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getSessionAsync, type Session } from '@/lib/auth/session';
import { logout } from '@/lib/auth/logout';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useDashboardData } from './hooks/useDashboardData';
import PageLayout from '@/components/layout/PageLayout';
import StatsCard from '@/components/ui/StatsCard';
import DashboardWatchersCard from './components/DashboardWatchersCard';
import DashboardDNSRecordsCard from './components/DashboardDNSRecordsCard';
import DashboardAuditLogsCard from './components/DashboardAuditLogsCard';

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [mounted, setMounted] = useState(false);

  // Use dashboard data hook
  const {
    stats,
    watchers,
    recentLogs,
    dnsRecords,
    loading,
    fetchDashboardData,
  } = useDashboardData();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    async function initialize() {
      if (!(await isAuthenticated())) {
        router.push('/');
        return;
      }

      // Get session data
      const sessionData = await getSessionAsync();
      setSession(sessionData);

      // Fetch all data
      fetchDashboardData();
    }

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, mounted]); // fetchDashboardData is stable from useCallback

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!mounted || loading) {
    return (
      <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <PageLayout
      currentPage="dashboard"
      session={session}
      isDarkMode={isDarkMode}
      onToggleDarkMode={toggleDarkMode}
      onLogout={handleLogout}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatsCard
          title="Total Domains"
          value={stats.totalZones}
          iconBgColor="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              />
            </svg>
          }
        />

        <StatsCard
          title="DNS Records"
          value={stats.totalRecords}
          iconBgColor="bg-green-100 dark:bg-green-900/30"
          iconColor="text-green-600 dark:text-green-400"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          }
        />

        <StatsCard
          title="Active Zones"
          value={stats.activeZones}
          iconBgColor="bg-purple-100 dark:bg-purple-900/30"
          iconColor="text-purple-600 dark:text-purple-400"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              />
            </svg>
          }
        />
      </div>

      {/* Grid Layout for Cards */}
      <div
        className={`grid grid-cols-1 ${
          session?.role === 'admin' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
        } gap-6 items-start`}
      >
        <DashboardWatchersCard watchers={watchers} />
        <DashboardDNSRecordsCard records={dnsRecords} />
        {session?.role === 'admin' && <DashboardAuditLogsCard logs={recentLogs} />}
      </div>
    </PageLayout>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getSessionAsync, type Session } from '@/lib/auth/session';
import { logout } from '@/lib/auth/logout';
import { fetchWithAuth } from '@/lib/api/client';
import { getInitialTheme, setTheme } from '@/lib/ui/theme';
import { useWatchers } from './hooks/useWatchers';
import { useWatcherForm } from './hooks/useWatcherForm';
import PageLayout from '@/components/layout/PageLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ServerIPCards from '@/components/watcher/ServerIPCards';
import AddWatcherModal from '@/components/watcher/AddWatcherModal';
import WatcherZoneSection from '@/components/watcher/WatcherZoneSection';

interface Zone {
  zoneName: string;
  zoneId: string;
}

interface DNSRecord {
  name: string;
  type: string;
  zone_name: string;
}

export default function WatcherPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [records, setRecords] = useState<DNSRecord[]>([]);

  // Use custom hooks
  const {
    watchers,
    serverIPs,
    checking,
    collapsedZones,
    fetchWatchers,
    checkWatchers,
    deleteWatcher,
    toggleWatcher,
    toggleZoneCollapse,
    addWatchers: addWatchersToList,
  } = useWatchers();

  const {
    showAddModal,
    setShowAddModal,
    selectedZone,
    setSelectedZone,
    selectedRecords,
    setSelectedRecords,
    selectedType,
    setSelectedType,
    toggleRecordSelection,
    selectAllRecords,
    clearRecordSelection,
    getAvailableRecords,
    addWatchers,
  } = useWatcherForm(watchers, addWatchersToList);

  useEffect(() => {
    async function initialize() {
      if (!(await isAuthenticated())) {
        router.push('/');
        return;
      }

      const sessionData = await getSessionAsync();
      setSession(sessionData);

      const shouldBeDark = getInitialTheme();
      setIsDarkMode(shouldBeDark);
      if (shouldBeDark) {
        setTheme(true);
      }

      fetchData();
    }

    initialize();
  }, [router]);

  const fetchData = async () => {
    try {
      const [zonesRes, recordsRes] = await Promise.all([
        fetchWithAuth('/api/zones'),
        fetchWithAuth('/api/dns/records'),
      ]);

      const zonesData = await zonesRes.json();
      const recordsData = await recordsRes.json();

      if (zonesData.success) {
        setZones(zonesData.data.zones);
      }

      if (recordsData.success) {
        setRecords(recordsData.data.records);
      }

      await fetchWatchers();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    setTheme(newDarkMode);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Group watchers by zone
  const watchersByZone = watchers.reduce((acc, watcher) => {
    if (!acc[watcher.zoneName]) {
      acc[watcher.zoneName] = [];
    }
    acc[watcher.zoneName].push(watcher);
    return acc;
  }, {} as Record<string, typeof watchers>);

  const availableRecords = getAvailableRecords(records);

  if (loading) {
    return (
      <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <PageLayout
      currentPage="watcher"
      session={session}
      isDarkMode={isDarkMode}
      onToggleDarkMode={toggleDarkMode}
      onLogout={handleLogout}
    >
      {/* Server IPs */}
      <ServerIPCards ipv4={serverIPs.ipv4} ipv6={serverIPs.ipv6} />

      {/* Watchers */}
      <Card
        title={`DNS Record Watchers (${watchers.length})`}
        headerAction={
          <div className="flex gap-3">
            <Button
              variant="success"
              onClick={checkWatchers}
              disabled={checking}
              isLoading={checking}
              size="sm"
            >
              Check All
            </Button>
            <Button
              onClick={() => setShowAddModal(true)}
              size="sm"
            >
              Add Watcher
            </Button>
          </div>
        }
      >
        {watchers.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400 mb-4">No watchers configured</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Add a watcher to monitor DNS records and ensure they match your server's IP
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(watchersByZone)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([zoneName, zoneWatchers]) => (
                <WatcherZoneSection
                  key={zoneName}
                  zoneName={zoneName}
                  watchers={zoneWatchers}
                  isCollapsed={collapsedZones.has(zoneName)}
                  onToggleCollapse={toggleZoneCollapse}
                  onToggleWatcher={toggleWatcher}
                  onDeleteWatcher={deleteWatcher}
                />
              ))}
          </div>
        )}
      </Card>

      {/* Add Watcher Modal */}
      <AddWatcherModal
        isOpen={showAddModal}
        zones={zones}
        records={records}
        selectedZone={selectedZone}
        setSelectedZone={setSelectedZone}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedRecords={selectedRecords}
        setSelectedRecords={setSelectedRecords}
        availableRecords={availableRecords}
        onClose={() => setShowAddModal(false)}
        onAdd={addWatchers}
        onToggleRecord={toggleRecordSelection}
        onSelectAll={() => selectAllRecords(availableRecords)}
        onClearSelection={clearRecordSelection}
      />
    </PageLayout>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getSessionAsync, type Session } from '@/lib/auth/session';
import { logout } from '@/lib/auth/logout';
import { fetchWithAuth } from '@/lib/api/client';
import { getInitialTheme, setTheme } from '@/lib/ui/theme';
import { filterRecords, getRecordsForZone } from '@/lib/dns/filtering';
import { useDNSRecords } from './hooks/useDNSRecords';
import { useZones } from './hooks/useZones';
import PageLayout from '@/components/layout/PageLayout';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import AddDNSRecordModal from '@/components/modals/AddDNSRecordModal';
import EditDNSRecordModal from '@/components/modals/EditDNSRecordModal';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal';

interface Zone {
  zoneName: string;
  zoneId: string;
  status: string;
  nameServers?: string[];
  createdOn?: string;
  modifiedOn?: string;
}

interface DNSRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
  zone_name: string;
}

export default function ZonesPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Use custom hooks for zone and record management
  const { selectedZone, setSelectedZone, searchTerm, setSearchTerm } = useZones();
  const {
    editingRecord,
    setEditingRecord,
    deletingRecord,
    setDeletingRecord,
    isSubmitting,
    handleEditRecord: handleEditRecordHook,
    handleDeleteRecord: handleDeleteRecordHook,
  } = useDNSRecords(zones, fetchData);

  // Wrapper functions to handle messages
  const handleEditRecord = async (e: React.FormEvent) => {
    const result = await handleEditRecordHook(e);
    if (result) setMessage(result);
  };

  const handleDeleteRecord = async () => {
    const result = await handleDeleteRecordHook();
    if (result) setMessage(result);
  };

  // Add record state
  const [addingRecord, setAddingRecord] = useState(false);
  const [isAddingSubmitting, setIsAddingSubmitting] = useState(false);
  const [hostIP, setHostIP] = useState<string>('');
  const [newRecord, setNewRecord] = useState({
    type: 'A',
    name: '',
    content: '',
    ttl: 1,
    proxied: false,
  });

  useEffect(() => {
    async function initialize() {
      if (!(await isAuthenticated())) {
        router.push('/');
        return;
      }

      // Get session data
      const sessionData = await getSessionAsync();
      setSession(sessionData);

      // Use theme utility
      const shouldBeDark = getInitialTheme();
      setIsDarkMode(shouldBeDark);
      if (shouldBeDark) {
        setTheme(true);
      }

      // Fetch data
      fetchData();
    }

    initialize();
  }, [router]);

  async function fetchData() {
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
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    setTheme(newDarkMode);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleOpenAddRecord = async () => {
    // Fetch host IP if not already fetched
    let ipToUse = hostIP;
    if (!hostIP) {
      try {
        const response = await fetchWithAuth('/api/ip');
        const data = await response.json();
        if (data.success && data.data.ipv4) {
          // Use IPv4 as the primary IP for pre-filling
          setHostIP(data.data.ipv4);
          ipToUse = data.data.ipv4;
        }
      } catch (error) {
        console.error('Error fetching host IP:', error);
      }
    }

    // Reset form WITH the IP pre-filled in content
    setNewRecord({
      type: 'A',
      name: '',
      content: ipToUse || '',
      ttl: 1,
      proxied: false,
    });

    // Open modal - content is already set with the IP
    setAddingRecord(true);
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone) return;

    // Find the zone ID for the selected zone
    const zone = zones.find(z => z.zoneName === selectedZone);
    if (!zone) {
      setMessage({ type: 'error', text: 'Zone not found' });
      return;
    }

    setIsAddingSubmitting(true);
    try {
      const response = await fetch('/api/dns/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRecord,
          zoneId: zone.zoneId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh records
        await fetchData();
        setAddingRecord(false);
        // Reset form
        setNewRecord({
          type: 'A',
          name: '',
          content: '',
          ttl: 1,
          proxied: false,
        });
        setMessage({ type: 'success', text: 'DNS record created successfully' });
      } else {
        const errorMsg = data.errors
          ? data.errors.map((e: { field: string; message: string }) => `${e.field}: ${e.message}`).join(', ')
          : data.error || 'Failed to create record';
        setMessage({ type: 'error', text: errorMsg });
      }
    } catch (error) {
      console.error('Error creating record:', error);
      setMessage({ type: 'error', text: 'Failed to create record' });
    } finally {
      setIsAddingSubmitting(false);
    }
  };

  // Use filtering utilities
  const filteredRecords = filterRecords(records, selectedZone, searchTerm);

  if (loading) {
    return (
      <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <PageLayout
      currentPage="zones"
      session={session}
      isDarkMode={isDarkMode}
      onToggleDarkMode={toggleDarkMode}
      onLogout={handleLogout}
    >
      {/* Toast Notifications */}
      {message && (
        <Toast
          type={message.type}
          message={message.text}
          onClose={() => setMessage(null)}
          autoClose={message.type === 'success'}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Zones List */}
          <div className="lg:col-span-3">
            <Card title={`Zones (${zones.length})`}>
              <div className="space-y-2">
                {zones.map((zone) => {
                  const zoneRecords = getRecordsForZone(records, zone.zoneName);
                  return (
                    <button
                      key={zone.zoneId}
                      onClick={() => setSelectedZone(zone.zoneName)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                        selectedZone === zone.zoneName
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {zone.zoneName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              zone.status === 'active'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                              {zone.status}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {zoneRecords.length} records
                            </span>
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* DNS Records */}
          <div className="lg:col-span-9">
            <Card
              headerAction={selectedZone && (
                <Button size="sm" onClick={handleOpenAddRecord}>
                  Add Record
                </Button>
              )}
            >
              {selectedZone ? (
                <>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    DNS Records - {selectedZone}
                  </h2>

                  {/* Search */}
                  <div className="mb-4">
                    <Input
                      type="text"
                      placeholder="Search records..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Records Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300 w-16">Type</th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300 w-48">Name</th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300">Content</th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300 w-16">TTL</th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300 w-24">Proxy</th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300 w-20">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecords.length > 0 ? (
                          filteredRecords.map((record) => (
                            <tr key={record.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="py-2 px-2">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                  {record.type}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-xs text-gray-900 dark:text-white font-mono truncate">
                                {record.name}
                              </td>
                              <td className="py-2 px-2 text-xs text-gray-600 dark:text-gray-400 font-mono truncate">
                                {record.content}
                              </td>
                              <td className="py-2 px-2 text-xs text-gray-600 dark:text-gray-400">
                                {record.ttl === 1 ? 'Auto' : record.ttl}
                              </td>
                              <td className="py-2 px-2">
                                {record.proxied ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                                    Proxy
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400">
                                    DNS
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-2">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setEditingRecord(record)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                    title="Edit record"
                                    aria-label={`Edit DNS record ${record.name}`}
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => setDeletingRecord(record)}
                                    className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                    title="Delete record"
                                    aria-label={`Delete DNS record ${record.name}`}
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-12 text-center">
                              <svg className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-gray-600 dark:text-gray-400">
                                {searchTerm ? 'No records match your search' : 'No DNS records found'}
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400">
                    Select a zone to view DNS records
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>

      {/* Modals - Using new modal components */}
      <AddDNSRecordModal
        isOpen={addingRecord}
        selectedZone={selectedZone}
        zones={zones}
        newRecord={newRecord}
        setNewRecord={setNewRecord}
        hostIP={hostIP}
        isSubmitting={isAddingSubmitting}
        onClose={() => {
          setAddingRecord(false);
          setNewRecord({
            type: 'A',
            name: '',
            content: '',
            ttl: 1,
            proxied: false,
          });
        }}
        onSubmit={handleAddRecord}
      />

      <EditDNSRecordModal
        isOpen={!!editingRecord}
        record={editingRecord}
        setRecord={setEditingRecord}
        isSubmitting={isSubmitting}
        onClose={() => setEditingRecord(null)}
        onSubmit={handleEditRecord}
      />

      <DeleteConfirmationModal
        isOpen={!!deletingRecord}
        record={deletingRecord}
        isSubmitting={isSubmitting}
        onClose={() => setDeletingRecord(null)}
        onConfirm={handleDeleteRecord}
      />
    </PageLayout>
  );
}

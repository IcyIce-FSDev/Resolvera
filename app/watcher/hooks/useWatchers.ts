import { useState } from 'react';
import { fetchWithAuth } from '@/lib/api/client';

export interface Watcher {
  id: string;
  recordName: string;
  recordType: 'A' | 'AAAA';
  zoneName: string;
  enabled: boolean;
  createdAt: string;
  lastChecked?: string;
  status?: 'ok' | 'mismatch' | 'error';
  currentIP?: string;
  expectedIP?: string;
}

export interface ServerIPs {
  ipv4: string | null;
  ipv6: string | null;
}

export function useWatchers() {
  const [watchers, setWatchers] = useState<Watcher[]>([]);
  const [serverIPs, setServerIPs] = useState<ServerIPs>({ ipv4: null, ipv6: null });
  const [checking, setChecking] = useState(false);
  const [collapsedZones, setCollapsedZones] = useState<Set<string>>(new Set());

  const fetchWatchers = async () => {
    try {
      const [watchersRes, ipRes] = await Promise.all([
        fetchWithAuth('/api/watchers'),
        fetchWithAuth('/api/ip'),
      ]);

      const watchersData = await watchersRes.json();
      const ipData = await ipRes.json();

      if (watchersData.success) {
        const fetchedWatchers = watchersData.data.watchers;
        setWatchers(fetchedWatchers);

        // Initialize all zones as collapsed by default
        const uniqueZones = new Set<string>(fetchedWatchers.map((w: Watcher) => w.zoneName));
        setCollapsedZones(uniqueZones);
      }

      if (ipData.success) {
        setServerIPs(ipData.data);
      }
    } catch (error) {
      console.error('Error fetching watchers:', error);
    }
  };

  const checkWatchers = async () => {
    setChecking(true);
    try {
      const response = await fetch('/api/watchers/check', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        setWatchers(data.data.results);
        setServerIPs(data.data.serverIPs);
      }
    } catch (error) {
      console.error('Error checking watchers:', error);
    } finally {
      setChecking(false);
    }
  };

  const deleteWatcher = async (id: string) => {
    try {
      const response = await fetch(`/api/watchers/${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        setWatchers(watchers.filter(w => w.id !== id));
      }
    } catch (error) {
      console.error('Error deleting watcher:', error);
    }
  };

  const toggleWatcher = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/watchers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });

      const data = await response.json();

      if (data.success) {
        setWatchers(watchers.map(w => w.id === id ? data.data.watcher : w));
      }
    } catch (error) {
      console.error('Error toggling watcher:', error);
    }
  };

  const toggleZoneCollapse = (zoneName: string) => {
    setCollapsedZones(prev => {
      const newSet = new Set(prev);
      if (newSet.has(zoneName)) {
        newSet.delete(zoneName);
      } else {
        newSet.add(zoneName);
      }
      return newSet;
    });
  };

  const addWatcher = (watcher: Watcher) => {
    setWatchers([...watchers, watcher]);
  };

  const addWatchers = (newWatchers: Watcher[]) => {
    setWatchers([...watchers, ...newWatchers]);
  };

  return {
    watchers,
    serverIPs,
    checking,
    collapsedZones,
    fetchWatchers,
    checkWatchers,
    deleteWatcher,
    toggleWatcher,
    toggleZoneCollapse,
    addWatcher,
    addWatchers,
  };
}

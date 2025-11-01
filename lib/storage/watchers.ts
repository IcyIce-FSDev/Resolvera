import { getAllWatchers, getWatcherById, createWatcher, updateWatcher as dbUpdateWatcher, deleteWatcher as dbDeleteWatcher, getZoneByZoneName } from '@/lib/db/database';

export interface Watcher {
  id: string;
  recordName: string;
  recordType: 'A' | 'AAAA';
  zoneName: string;
  enabled: boolean;
  createdAt: string | Date;
  lastChecked?: string | Date | null;
  status?: 'ok' | 'mismatch' | 'error' | null;
  currentIP?: string | null;
  expectedIP?: string | null;
}

// Read all watchers
export async function getWatchers(): Promise<Watcher[]> {
  try {
    const watchers = await getAllWatchers();
    return watchers.map(w => ({
      id: w.id,
      recordName: w.recordName,
      recordType: w.recordType as 'A' | 'AAAA',
      zoneName: w.zoneName,
      enabled: w.enabled,
      createdAt: w.createdAt,
      lastChecked: w.lastChecked,
      status: w.status as 'ok' | 'mismatch' | 'error' | null,
      currentIP: w.currentIP,
      expectedIP: w.expectedIP,
    }));
  } catch (error) {
    console.error('Error reading watchers:', error);
    return [];
  }
}

// Add a new watcher
export async function addWatcher(watcher: Omit<Watcher, 'id' | 'createdAt'>): Promise<Watcher> {
  try {
    // Get zone ID by zone name for the relation
    const zone = await getZoneByZoneName(watcher.zoneName);

    const newWatcher = await createWatcher({
      recordName: watcher.recordName,
      recordType: watcher.recordType,
      zoneName: watcher.zoneName,
      enabled: watcher.enabled ?? true,
      status: watcher.status || undefined,
      currentIP: watcher.currentIP || undefined,
      expectedIP: watcher.expectedIP || undefined,
      zoneId: zone?.id || undefined,
    });

    return {
      id: newWatcher.id,
      recordName: newWatcher.recordName,
      recordType: newWatcher.recordType as 'A' | 'AAAA',
      zoneName: newWatcher.zoneName,
      enabled: newWatcher.enabled,
      createdAt: newWatcher.createdAt,
      lastChecked: newWatcher.lastChecked,
      status: newWatcher.status as 'ok' | 'mismatch' | 'error' | null,
      currentIP: newWatcher.currentIP,
      expectedIP: newWatcher.expectedIP,
    };
  } catch (error) {
    console.error('Error adding watcher:', error);
    throw error;
  }
}

// Update a watcher
export async function updateWatcher(id: string, updates: Partial<Watcher>): Promise<Watcher | null> {
  try {
    const updated = await dbUpdateWatcher(id, {
      recordName: updates.recordName,
      recordType: updates.recordType,
      zoneName: updates.zoneName,
      enabled: updates.enabled,
      status: updates.status || null,
      lastChecked: updates.lastChecked ? new Date(updates.lastChecked) : undefined,
      currentIP: updates.currentIP,
      expectedIP: updates.expectedIP,
    });

    if (!updated) {
      return null;
    }

    return {
      id: updated.id,
      recordName: updated.recordName,
      recordType: updated.recordType as 'A' | 'AAAA',
      zoneName: updated.zoneName,
      enabled: updated.enabled,
      createdAt: updated.createdAt,
      lastChecked: updated.lastChecked,
      status: updated.status as 'ok' | 'mismatch' | 'error' | null,
      currentIP: updated.currentIP,
      expectedIP: updated.expectedIP,
    };
  } catch (error) {
    console.error('Error updating watcher:', error);
    return null;
  }
}

// Delete a watcher
export async function deleteWatcher(id: string): Promise<boolean> {
  try {
    await dbDeleteWatcher(id);
    return true;
  } catch (error) {
    console.error('Error deleting watcher:', error);
    return false;
  }
}

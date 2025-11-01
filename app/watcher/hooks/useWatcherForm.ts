import { useState } from 'react';
import { Watcher } from './useWatchers';

interface Zone {
  zoneName: string;
  zoneId: string;
}

interface DNSRecord {
  name: string;
  type: string;
  zone_name: string;
}

export function useWatcherForm(
  watchers: Watcher[],
  onAddWatchers: (watchers: Watcher[]) => void
) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<'A' | 'AAAA'>('A');

  const toggleRecordSelection = (recordName: string) => {
    setSelectedRecords(prev =>
      prev.includes(recordName)
        ? prev.filter(r => r !== recordName)
        : [...prev, recordName]
    );
  };

  const selectAllRecords = (availableRecords: DNSRecord[]) => {
    const available = availableRecords.filter(r => r.type === selectedType);
    setSelectedRecords(available.map(r => r.name));
  };

  const clearRecordSelection = () => {
    setSelectedRecords([]);
  };

  const getAvailableRecords = (records: DNSRecord[]): DNSRecord[] => {
    return records.filter(r => {
      // Only show A and AAAA records from the selected zone
      if (r.zone_name !== selectedZone || (r.type !== 'A' && r.type !== 'AAAA')) {
        return false;
      }

      // Exclude records that are already being watched
      const isAlreadyWatched = watchers.some(w =>
        w.zoneName === r.zone_name &&
        w.recordName === r.name &&
        w.recordType === r.type
      );

      return !isAlreadyWatched;
    });
  };

  const addWatchers = async () => {
    try {
      const newWatchers = [];

      // Add a watcher for each selected record
      for (const recordName of selectedRecords) {
        const response = await fetch('/api/watchers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recordName,
            recordType: selectedType,
            zoneName: selectedZone,
          }),
        });

        const data = await response.json();

        if (data.success) {
          newWatchers.push(data.data.watcher);
        }
      }

      onAddWatchers(newWatchers);
      setShowAddModal(false);
      setSelectedZone('');
      setSelectedRecords([]);
      setSelectedType('A');
    } catch (error) {
      console.error('Error adding watchers:', error);
    }
  };

  return {
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
  };
}

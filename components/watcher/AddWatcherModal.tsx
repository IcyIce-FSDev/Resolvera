import Button from '@/components/ui/Button';

interface Zone {
  zoneName: string;
  zoneId: string;
}

interface DNSRecord {
  name: string;
  type: string;
  zone_name: string;
}

interface AddWatcherModalProps {
  isOpen: boolean;
  zones: Zone[];
  records: DNSRecord[];
  selectedZone: string;
  setSelectedZone: (zone: string) => void;
  selectedType: 'A' | 'AAAA';
  setSelectedType: (type: 'A' | 'AAAA') => void;
  selectedRecords: string[];
  setSelectedRecords: (records: string[]) => void;
  availableRecords: DNSRecord[];
  onClose: () => void;
  onAdd: () => void;
  onToggleRecord: (recordName: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

export default function AddWatcherModal({
  isOpen,
  zones,
  selectedZone,
  setSelectedZone,
  selectedType,
  setSelectedType,
  selectedRecords,
  setSelectedRecords,
  availableRecords,
  onClose,
  onAdd,
  onToggleRecord,
  onSelectAll,
  onClearSelection,
}: AddWatcherModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Add DNS Watcher
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Zone
            </label>
            <select
              value={selectedZone}
              onChange={(e) => {
                setSelectedZone(e.target.value);
                setSelectedRecords([]);
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select a zone</option>
              {zones.map((zone) => (
                <option key={zone.zoneId} value={zone.zoneName}>
                  {zone.zoneName}
                </option>
              ))}
            </select>
          </div>

          {selectedZone && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Record Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value as 'A' | 'AAAA');
                    setSelectedRecords([]);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="A">A (IPv4)</option>
                  <option value="AAAA">AAAA (IPv6)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    DNS Records ({selectedRecords.length} selected)
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={onSelectAll}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Select All
                    </button>
                    {selectedRecords.length > 0 && (
                      <button
                        onClick={onClearSelection}
                        className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-64 overflow-y-auto">
                  {availableRecords.filter(r => r.type === selectedType).length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No {selectedType} records found in this zone
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {availableRecords
                        .filter(r => r.type === selectedType)
                        .map((record, idx) => (
                          <label
                            key={idx}
                            className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedRecords.includes(record.name)}
                              onChange={() => onToggleRecord(record.name)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                            />
                            <span className="ml-3 text-sm text-gray-900 dark:text-white font-mono">
                              {record.name}
                            </span>
                          </label>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onAdd}
            disabled={!selectedZone || selectedRecords.length === 0}
            className="flex-1"
          >
            Add Watcher{selectedRecords.length > 1 ? 's' : ''} ({selectedRecords.length})
          </Button>
        </div>
      </div>
    </div>
  );
}

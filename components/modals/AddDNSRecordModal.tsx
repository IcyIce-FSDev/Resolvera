import React from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface Zone {
  zoneName: string;
  zoneId: string;
  status: string;
  nameServers?: string[];
  createdOn?: string;
  modifiedOn?: string;
}

interface NewRecord {
  type: string;
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
}

interface AddDNSRecordModalProps {
  isOpen: boolean;
  selectedZone: string | null;
  zones: Zone[];
  newRecord: NewRecord;
  setNewRecord: React.Dispatch<React.SetStateAction<NewRecord>>;
  hostIP: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function AddDNSRecordModal({
  isOpen,
  selectedZone,
  zones,
  newRecord,
  setNewRecord,
  hostIP,
  isSubmitting,
  onClose,
  onSubmit,
}: AddDNSRecordModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Add DNS Record to {selectedZone}
          </h3>
          <form onSubmit={onSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <select
                  value={newRecord.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setNewRecord(prev => {
                      // Auto-fill host IP when switching to A or AAAA record
                      if ((newType === 'A' || newType === 'AAAA') && hostIP && !prev.content) {
                        return { ...prev, type: newType, content: hostIP };
                      }
                      return { ...prev, type: newType };
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="A">A</option>
                  <option value="AAAA">AAAA</option>
                  <option value="CNAME">CNAME</option>
                  <option value="MX">MX</option>
                  <option value="TXT">TXT</option>
                  <option value="NS">NS</option>
                  <option value="SRV">SRV</option>
                  <option value="CAA">CAA</option>
                  <option value="PTR">PTR</option>
                </select>
              </div>

              <Input
                label="Name"
                type="text"
                value={newRecord.name}
                onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
                hint={`Use @ for root domain (${selectedZone})`}
                required
              />

              <Input
                label="Content"
                type="text"
                value={newRecord.content}
                onChange={(e) => setNewRecord({ ...newRecord, content: e.target.value })}
                hint={
                  newRecord.type === 'A' ? `IPv4 address${hostIP ? ' (pre-filled with host IP: ' + hostIP + ')' : ' (e.g., 192.0.2.1)'}` :
                  newRecord.type === 'AAAA' ? `IPv6 address${hostIP ? ' (pre-filled with host IP: ' + hostIP + ')' : ' (e.g., 2001:db8::1)'}` :
                  newRecord.type === 'CNAME' ? 'Target domain (e.g., example.com)' :
                  newRecord.type === 'MX' ? 'Mail server (e.g., mail.example.com)' :
                  newRecord.type === 'TXT' ? 'Text content' :
                  'Record value'
                }
                className="font-mono"
                required
              />

              <Input
                label="TTL"
                type="number"
                value={newRecord.ttl}
                onChange={(e) => setNewRecord({ ...newRecord, ttl: parseInt(e.target.value) })}
                hint="Use 1 for Auto (default: 1)"
                required
                min="1"
              />

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newRecord.proxied}
                    onChange={(e) => setNewRecord({ ...newRecord, proxied: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={newRecord.type !== 'A' && newRecord.type !== 'AAAA' && newRecord.type !== 'CNAME'}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Proxied (Orange Cloud) {(newRecord.type !== 'A' && newRecord.type !== 'AAAA' && newRecord.type !== 'CNAME') && '(Only available for A, AAAA, CNAME)'}
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
              >
                Add Record
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

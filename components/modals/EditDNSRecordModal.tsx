import React from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface DNSRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
  zone_name: string;
}

interface EditDNSRecordModalProps {
  isOpen: boolean;
  record: DNSRecord | null;
  setRecord: React.Dispatch<React.SetStateAction<DNSRecord | null>>;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function EditDNSRecordModal({
  isOpen,
  record,
  setRecord,
  isSubmitting,
  onClose,
  onSubmit,
}: EditDNSRecordModalProps) {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Edit DNS Record
          </h3>
          <form onSubmit={onSubmit}>
            <div className="space-y-4">
              <Input
                label="Type"
                type="text"
                value={record.type}
                disabled
                className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />

              <Input
                label="Name"
                type="text"
                value={record.name}
                onChange={(e) => setRecord({ ...record, name: e.target.value })}
                required
              />

              <Input
                label="Content"
                type="text"
                value={record.content}
                onChange={(e) => setRecord({ ...record, content: e.target.value })}
                className="font-mono"
                required
              />

              <Input
                label="TTL"
                type="number"
                value={record.ttl}
                onChange={(e) => setRecord({ ...record, ttl: parseInt(e.target.value) })}
                hint="Use 1 for Auto"
                required
                min="1"
              />

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={record.proxied}
                    onChange={(e) => setRecord({ ...record, proxied: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Proxied (Orange Cloud)
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
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

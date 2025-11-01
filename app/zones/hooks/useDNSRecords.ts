import { useState } from 'react';

interface DNSRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
  zone_name: string;
}

interface Zone {
  zoneName: string;
  zoneId: string;
  status: string;
  nameServers?: string[];
  createdOn?: string;
  modifiedOn?: string;
}

interface Message {
  type: 'success' | 'error';
  text: string;
}

export function useDNSRecords(zones: Zone[], refreshData: () => Promise<void>) {
  const [editingRecord, setEditingRecord] = useState<DNSRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<DNSRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEditRecord = async (e: React.FormEvent): Promise<Message | null> => {
    e.preventDefault();
    if (!editingRecord) return null;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/dns/records/${editingRecord.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: editingRecord.type,
          name: editingRecord.name,
          content: editingRecord.content,
          ttl: editingRecord.ttl,
          proxied: editingRecord.proxied,
          zone_name: editingRecord.zone_name,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await refreshData();
        setEditingRecord(null);
        return { type: 'success', text: 'DNS record updated successfully' };
      } else {
        return { type: 'error', text: data.error || 'Failed to update record' };
      }
    } catch (error) {
      console.error('Error updating record:', error);
      return { type: 'error', text: 'Failed to update record' };
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRecord = async (): Promise<Message | null> => {
    if (!deletingRecord) return null;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/dns/records/${deletingRecord.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone_name: deletingRecord.zone_name,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await refreshData();
        setDeletingRecord(null);
        return { type: 'success', text: 'DNS record deleted successfully' };
      } else {
        return { type: 'error', text: data.error || 'Failed to delete record' };
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      return { type: 'error', text: 'Failed to delete record' };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    editingRecord,
    setEditingRecord,
    deletingRecord,
    setDeletingRecord,
    isSubmitting,
    handleEditRecord,
    handleDeleteRecord,
  };
}

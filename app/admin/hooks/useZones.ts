import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/api/client';
import { TabName, Message } from '@/app/admin/types';

interface Zone {
  zoneName: string;
  zoneId: string;
  apiToken: string;
}

export function useZones(activeTab: TabName) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [showAddZone, setShowAddZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneId, setNewZoneId] = useState('');
  const [newApiToken, setNewApiToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchZones = async () => {
    try {
      const response = await fetchWithAuth('/api/admin/zones');
      const data = await response.json();
      if (data.success) {
        setZones(data.data.zones);
      }
    } catch (error) {
      console.error('Error fetching zones:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'zones') {
      fetchZones();
    }
  }, [activeTab]);

  const handleAddZone = async (e: React.FormEvent): Promise<Message | null> => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetchWithAuth('/api/admin/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneName: newZoneName,
          zoneId: newZoneId,
          apiToken: newApiToken,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewZoneName('');
        setNewZoneId('');
        setNewApiToken('');
        setShowAddZone(false);
        await fetchZones();
        return { type: 'success', text: 'Zone added successfully' };
      } else {
        return { type: 'error', text: data.error || 'Failed to add zone' };
      }
    } catch (error) {
      return { type: 'error', text: 'Failed to add zone' };
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteZone = async (zoneId: string): Promise<Message | null> => {
    if (!confirm('Are you sure you want to remove this zone?')) return null;

    setIsSubmitting(true);

    try {
      const response = await fetchWithAuth(`/api/admin/zones/${zoneId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchZones();
        return { type: 'success', text: 'Zone removed successfully' };
      } else {
        return { type: 'error', text: data.error || 'Failed to remove zone' };
      }
    } catch (error) {
      return { type: 'error', text: 'Failed to remove zone' };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    zones,
    showAddZone,
    newZoneName,
    newZoneId,
    newApiToken,
    isSubmitting,
    setShowAddZone,
    setNewZoneName,
    setNewZoneId,
    setNewApiToken,
    handleAddZone,
    handleDeleteZone,
  };
}

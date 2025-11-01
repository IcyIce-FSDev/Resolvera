import { useState } from 'react';

export function useZones() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  return {
    selectedZone,
    setSelectedZone,
    searchTerm,
    setSearchTerm,
  };
}

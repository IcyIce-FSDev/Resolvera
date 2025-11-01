/**
 * DNS Record filtering utilities
 */

interface DNSRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
  zone_name: string;
}

/**
 * Get records for a specific zone
 */
export function getRecordsForZone(records: DNSRecord[], zoneName: string): DNSRecord[] {
  return records.filter(record => record.zone_name === zoneName);
}

/**
 * Filter records by search term (searches name, type, and content)
 */
export function filterRecords(
  records: DNSRecord[],
  selectedZone: string | null,
  searchTerm: string
): DNSRecord[] {
  if (!selectedZone) return [];

  const zoneRecords = getRecordsForZone(records, selectedZone);

  if (!searchTerm) return zoneRecords;

  const term = searchTerm.toLowerCase();
  return zoneRecords.filter(record =>
    record.name.toLowerCase().includes(term) ||
    record.type.toLowerCase().includes(term) ||
    record.content.toLowerCase().includes(term)
  );
}

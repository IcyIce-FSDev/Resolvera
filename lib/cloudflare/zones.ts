// Cloudflare Zones and DNS Records Management
import { getAllZones, createZone, updateZone, deleteZone, getZoneByZoneId } from '@/lib/db/database';
import { decryptIfNeeded, encryptIfNeeded } from '@/lib/security/encryption';

export interface Zone {
  apiToken: string;
  zoneId: string;
  zoneName: string;
}

export interface DNSRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
  zone_id: string;
  zone_name: string;
  created_on: string;
  modified_on: string;
}

/**
 * Read zones from database and decrypt API tokens
 */
export async function getZones(): Promise<Zone[]> {
  try {
    const dbZones = await getAllZones();

    // Decrypt API tokens for use
    return dbZones.map((zone) => ({
      zoneName: zone.zoneName,
      zoneId: zone.zoneId,
      apiToken: decryptIfNeeded(zone.apiToken),
    }));
  } catch (error) {
    console.error('Error reading zones from database:', error);
    return [];
  }
}

/**
 * Save a single zone to database with encrypted API token
 */
export async function saveZone(zone: Zone): Promise<void> {
  try {
    // Encrypt API token before saving
    const encryptedToken = encryptIfNeeded(zone.apiToken);

    // Check if zone already exists
    const existingZone = await getZoneByZoneId(zone.zoneId);

    if (existingZone) {
      // Update existing zone
      await updateZone(existingZone.id, {
        zoneName: zone.zoneName,
        apiToken: encryptedToken,
      });
    } else {
      // Create new zone
      await createZone({
        zoneName: zone.zoneName,
        zoneId: zone.zoneId,
        apiToken: encryptedToken,
      });
    }
  } catch (error) {
    console.error('Error saving zone to database:', error);
    throw error;
  }
}

/**
 * Delete a zone from database
 */
export async function removeZone(zoneId: string): Promise<void> {
  try {
    const zone = await getZoneByZoneId(zoneId);
    if (zone) {
      await deleteZone(zone.id);
    }
  } catch (error) {
    console.error('Error deleting zone from database:', error);
    throw error;
  }
}

// Fetch DNS records from Cloudflare for a specific zone
export async function fetchDNSRecordsForZone(zone: Zone): Promise<DNSRecord[]> {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zone.zoneId}/dns_records`,
      {
        headers: {
          'Authorization': `Bearer ${zone.apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`Cloudflare API returned errors: ${JSON.stringify(data.errors)}`);
    }

    // Add zone information to each record
    return data.result.map((record: any) => ({
      ...record,
      zone_id: zone.zoneId,
      zone_name: zone.zoneName,
    }));
  } catch (error) {
    console.error(`Error fetching DNS records for ${zone.zoneName}:`, error);
    throw error;
  }
}

// Fetch DNS records from all zones
export async function fetchAllDNSRecords(): Promise<DNSRecord[]> {
  const zones = await getZones();
  const allRecords: DNSRecord[] = [];

  for (const zone of zones) {
    try {
      const records = await fetchDNSRecordsForZone(zone);
      allRecords.push(...records);
    } catch (error) {
      console.error(`Failed to fetch records for zone ${zone.zoneName}:`, error);
      // Continue with other zones even if one fails
    }
  }

  return allRecords;
}

// Get zone information from Cloudflare
export async function fetchZoneInfo(zone: Zone) {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zone.zoneId}`,
      {
        headers: {
          'Authorization': `Bearer ${zone.apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`Cloudflare API returned errors: ${JSON.stringify(data.errors)}`);
    }

    return data.result;
  } catch (error) {
    console.error(`Error fetching zone info for ${zone.zoneName}:`, error);
    throw error;
  }
}

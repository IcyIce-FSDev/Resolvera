/**
 * Cloudflare API wrapper for DNS record operations
 * Provides a consistent interface for all Cloudflare API calls
 */

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

/**
 * Cloudflare API response structure
 */
export interface CloudflareResponse<T = any> {
  success: boolean;
  result?: T;
  errors?: Array<{
    code: number;
    message: string;
  }>;
  messages?: string[];
}

/**
 * DNS record data for API calls
 */
export interface DNSRecordData {
  type: string;
  name: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
  comment?: string;
  priority?: number;
}

/**
 * Make a Cloudflare API call for DNS record operations
 *
 * @param method - HTTP method (GET, POST, PATCH, DELETE)
 * @param zoneId - Cloudflare zone ID
 * @param apiToken - Cloudflare API token (should already be decrypted)
 * @param recordId - Optional DNS record ID (for PATCH/DELETE operations)
 * @param body - Optional request body (for POST/PATCH operations)
 * @returns Cloudflare API response
 *
 * @example
 * ```typescript
 * // Create a DNS record
 * const result = await callCloudflareAPI(
 *   'POST',
 *   zoneId,
 *   apiToken,
 *   undefined,
 *   { type: 'A', name: 'example.com', content: '1.2.3.4' }
 * );
 *
 * // Update a DNS record
 * const result = await callCloudflareAPI(
 *   'PATCH',
 *   zoneId,
 *   apiToken,
 *   recordId,
 *   { content: '5.6.7.8' }
 * );
 *
 * // Delete a DNS record
 * const result = await callCloudflareAPI('DELETE', zoneId, apiToken, recordId);
 * ```
 */
export async function callCloudflareAPI(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  zoneId: string,
  apiToken: string,
  recordId?: string,
  body?: Partial<DNSRecordData>
): Promise<CloudflareResponse> {
  // Build URL
  let url = `${CLOUDFLARE_API_BASE}/zones/${zoneId}/dns_records`;
  if (recordId) {
    url += `/${recordId}`;
  }

  // Make request
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  return await response.json();
}

/**
 * Fetch all DNS records for a zone
 *
 * @param zoneId - Cloudflare zone ID
 * @param apiToken - Cloudflare API token (should already be decrypted)
 * @returns Cloudflare API response with DNS records
 *
 * @example
 * ```typescript
 * const records = await fetchDNSRecords(zoneId, apiToken);
 * if (records.success) {
 *   console.log(records.result);
 * }
 * ```
 */
export async function fetchDNSRecords(
  zoneId: string,
  apiToken: string
): Promise<CloudflareResponse> {
  return callCloudflareAPI('GET', zoneId, apiToken);
}

/**
 * Create a new DNS record
 *
 * @param zoneId - Cloudflare zone ID
 * @param apiToken - Cloudflare API token (should already be decrypted)
 * @param recordData - DNS record data
 * @returns Cloudflare API response
 *
 * @example
 * ```typescript
 * const result = await createDNSRecord(zoneId, apiToken, {
 *   type: 'A',
 *   name: 'example.com',
 *   content: '1.2.3.4',
 *   ttl: 3600,
 *   proxied: true
 * });
 * ```
 */
export async function createDNSRecord(
  zoneId: string,
  apiToken: string,
  recordData: DNSRecordData
): Promise<CloudflareResponse> {
  return callCloudflareAPI('POST', zoneId, apiToken, undefined, recordData);
}

/**
 * Update an existing DNS record
 *
 * @param zoneId - Cloudflare zone ID
 * @param apiToken - Cloudflare API token (should already be decrypted)
 * @param recordId - DNS record ID
 * @param recordData - Partial DNS record data to update
 * @returns Cloudflare API response
 *
 * @example
 * ```typescript
 * const result = await updateDNSRecord(zoneId, apiToken, recordId, {
 *   content: '5.6.7.8'
 * });
 * ```
 */
export async function updateDNSRecord(
  zoneId: string,
  apiToken: string,
  recordId: string,
  recordData: Partial<DNSRecordData>
): Promise<CloudflareResponse> {
  return callCloudflareAPI('PATCH', zoneId, apiToken, recordId, recordData);
}

/**
 * Delete a DNS record
 *
 * @param zoneId - Cloudflare zone ID
 * @param apiToken - Cloudflare API token (should already be decrypted)
 * @param recordId - DNS record ID
 * @returns Cloudflare API response
 *
 * @example
 * ```typescript
 * const result = await deleteDNSRecord(zoneId, apiToken, recordId);
 * if (result.success) {
 *   console.log('Record deleted');
 * }
 * ```
 */
export async function deleteDNSRecord(
  zoneId: string,
  apiToken: string,
  recordId: string
): Promise<CloudflareResponse> {
  return callCloudflareAPI('DELETE', zoneId, apiToken, recordId);
}

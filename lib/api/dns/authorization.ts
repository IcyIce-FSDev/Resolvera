import { getZones } from '@/lib/cloudflare/zones';

/**
 * Zone configuration with credentials
 */
export interface ZoneConfig {
  zoneName: string;
  zoneId: string;
  apiToken: string;
  status?: string;
  nameServers?: string[];
  createdOn?: string;
  modifiedOn?: string;
}

/**
 * User object from authenticated request
 */
export interface AuthorizedUser {
  userId: string;
  email: string;
  name: string;
  role: string; // 'admin' or 'user'
  assignedZoneIds?: string[];
}

/**
 * Authorization result
 */
export interface AuthorizationResult {
  authorized: boolean;
  zoneConfig?: ZoneConfig;
  error?: string;
  statusCode?: number;
}

/**
 * Authorize DNS record access by zone name
 * Checks if the user has permission to access the specified zone
 *
 * @param user - The authenticated user
 * @param zoneName - The zone name to check access for
 * @returns Authorization result with zone config if authorized
 *
 * @example
 * ```typescript
 * const auth = await authorizeDNSRecordAccessByName(user, 'example.com');
 * if (!auth.authorized) {
 *   return errorResponse(auth.error, auth.statusCode);
 * }
 * // Use auth.zoneConfig.apiToken to make Cloudflare API calls
 * ```
 */
export async function authorizeDNSRecordAccessByName(
  user: AuthorizedUser,
  zoneName: string
): Promise<AuthorizationResult> {
  // Get zone credentials
  const zones = await getZones();
  const zoneConfig = zones.find((z) => z.zoneName === zoneName);

  if (!zoneConfig) {
    return {
      authorized: false,
      error: 'Zone configuration not found',
      statusCode: 404,
    };
  }

  // Check if user has access to this zone
  if (user.role !== 'admin') {
    if (!user.assignedZoneIds || !user.assignedZoneIds.includes(zoneConfig.zoneId)) {
      return {
        authorized: false,
        error: 'Access denied: You do not have permission to modify this zone',
        statusCode: 403,
      };
    }
  }

  return {
    authorized: true,
    zoneConfig,
  };
}

/**
 * Authorize DNS record access by zone ID
 * Checks if the user has permission to access the specified zone
 *
 * @param user - The authenticated user
 * @param zoneId - The zone ID to check access for
 * @returns Authorization result with zone config if authorized
 *
 * @example
 * ```typescript
 * const auth = await authorizeDNSRecordAccessById(user, 'abc123');
 * if (!auth.authorized) {
 *   return errorResponse(auth.error, auth.statusCode);
 * }
 * // Use auth.zoneConfig.apiToken to make Cloudflare API calls
 * ```
 */
export async function authorizeDNSRecordAccessById(
  user: AuthorizedUser,
  zoneId: string
): Promise<AuthorizationResult> {
  // Get all zones to find the zone and check permissions
  const allZones = await getZones();
  const zone = allZones.find((z: any) => z.zoneId === zoneId);

  if (!zone) {
    return {
      authorized: false,
      error: 'Zone not found',
      statusCode: 404,
    };
  }

  // Check if user has access to this zone
  if (user.role !== 'admin') {
    if (!user.assignedZoneIds || !user.assignedZoneIds.includes(zoneId)) {
      return {
        authorized: false,
        error: 'Access denied: You do not have permission to modify this zone',
        statusCode: 403,
      };
    }
  }

  return {
    authorized: true,
    zoneConfig: zone,
  };
}

/**
 * Get filtered zones based on user permissions
 * Returns all zones for admin users, only assigned zones for regular users
 *
 * @param user - The authenticated user
 * @returns Array of zones the user has access to
 *
 * @example
 * ```typescript
 * const userZones = await getAuthorizedZones(user);
 * ```
 */
export async function getAuthorizedZones(user: AuthorizedUser): Promise<ZoneConfig[]> {
  const allZones = await getZones();

  // Admin users can see all zones
  if (user.role === 'admin') {
    return allZones;
  }

  // Regular users only see their assigned zones
  if (!user.assignedZoneIds || user.assignedZoneIds.length === 0) {
    return [];
  }

  return allZones.filter((zone) => user.assignedZoneIds!.includes(zone.zoneId));
}

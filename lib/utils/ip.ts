/**
 * IP address utilities
 */

/**
 * Normalize IPv4-mapped IPv6 addresses to standard IPv4
 * Converts ::ffff:192.168.1.1 to 192.168.1.1
 *
 * @param ip - IP address to normalize
 * @returns Normalized IP address
 *
 * @example
 * ```typescript
 * normalizeIP('::ffff:192.168.1.1'); // Returns '192.168.1.1'
 * normalizeIP('192.168.1.1'); // Returns '192.168.1.1'
 * ```
 */
export function normalizeIP(ip: string): string {
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  return ip;
}

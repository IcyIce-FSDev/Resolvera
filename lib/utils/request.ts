/**
 * Request utilities for extracting context information
 */

import { normalizeIP } from './ip';

/**
 * Extract user information from a request
 * Gets user ID, email, name, IP address, and user agent from request headers
 *
 * @param request - The HTTP request object
 * @param user - Optional user object containing userId/id, email, name
 * @returns Object containing userId, userEmail, userName, ip, userAgent
 *
 * @example
 * ```typescript
 * const userInfo = getUserInfoFromRequest(request, user);
 * // Returns: { userId, userEmail, userName, ip, userAgent }
 * ```
 */
export function getUserInfoFromRequest(request: Request, user?: any) {
  const rawIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  return {
    userId: user?.userId || user?.id,
    userEmail: user?.email,
    userName: user?.name,
    ip: normalizeIP(rawIP),
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
}

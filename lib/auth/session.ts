// Authentication session management
// JWT-based authentication with HTTP-only cookies

export interface Session {
  userId: string;
  email: string;
  name: string;
  role: string;
}

// Cache for session data to avoid excessive API calls
let sessionCache: Session | null | undefined = undefined;
let cacheTimestamp = 0;
const CACHE_DURATION = 5000; // 5 seconds

// Promise cache to prevent duplicate concurrent requests
let pendingRequest: Promise<Session | null> | null = null;

/**
 * Get current user session from JWT token (async version)
 * Makes API call to verify JWT token and get user info
 * Prevents duplicate concurrent requests
 */
export const getSessionAsync = async (): Promise<Session | null> => {
  if (typeof window === 'undefined') {
    return null;
  }

  // Return cached session if still valid
  const now = Date.now();
  if (sessionCache !== undefined && now - cacheTimestamp < CACHE_DURATION) {
    return sessionCache;
  }

  // If there's already a pending request, wait for it instead of making a new one
  if (pendingRequest) {
    return pendingRequest;
  }

  // Create and cache the promise to prevent duplicate requests
  pendingRequest = (async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Include cookies
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.user) {
          sessionCache = result.data.user;
          cacheTimestamp = Date.now();
          return result.data.user;
        }
      }

      sessionCache = null;
      cacheTimestamp = Date.now();
      return null;
    } catch (error) {
      console.error('Failed to get session:', error);
      sessionCache = null;
      cacheTimestamp = Date.now();
      return null;
    } finally {
      // Clear pending request after completion
      pendingRequest = null;
    }
  })();

  return pendingRequest;
};

/**
 * Get current user session (synchronous, uses cache)
 * Returns cached session or null. Call getSessionAsync() first to populate cache.
 */
export const getSession = (): Session | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  // Return cached session if available
  if (sessionCache !== undefined) {
    return sessionCache;
  }

  // No cache available, return null
  // Caller should use getSessionAsync() to fetch from server
  return null;
};

/**
 * Clear session cache (call after logout)
 */
export const clearSession = (): void => {
  sessionCache = null;
  cacheTimestamp = 0;
  pendingRequest = null;
};

/**
 * Check if user is authenticated (async version)
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getSessionAsync();
  return session !== null;
};

/**
 * Create session after login (backwards compatibility)
 * Now this is a no-op since JWT is handled server-side
 */
export const createSession = (userId: string, email: string, name: string, role: string): Session => {
  const session: Session = {
    userId,
    email,
    name,
    role,
  };

  // Set in cache
  sessionCache = session;
  cacheTimestamp = Date.now();

  return session;
};

/**
 * Extend session (no-op for JWT, handled server-side)
 */
export const extendSession = (): void => {
  // JWT expiration is handled server-side
  // This is kept for backwards compatibility
};

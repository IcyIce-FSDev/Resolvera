// API client utilities
// Helper functions for making authenticated API requests

/**
 * Make an authenticated API request
 * JWT token is automatically included in HTTP-only cookie
 *
 * @deprecated This is now just a wrapper around fetch. You can use fetch directly.
 * Kept for backwards compatibility.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  // JWT cookie is automatically sent with credentials: 'include'
  return fetch(url, {
    ...options,
    credentials: 'include', // Ensure cookies are sent
  });
}

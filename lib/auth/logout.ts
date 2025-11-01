// Logout utility
import { clearSession } from './session';

/**
 * Logout the current user
 * Clears JWT token cookie and session cache
 */
export async function logout(): Promise<boolean> {
  try {
    // Call logout API to clear cookie
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    // Clear client-side cache
    clearSession();

    return response.ok;
  } catch (error) {
    console.error('Logout error:', error);
    // Clear cache anyway
    clearSession();
    return false;
  }
}

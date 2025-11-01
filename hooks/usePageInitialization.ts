import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getSessionAsync, type Session } from '@/lib/auth/session';

/**
 * Consolidated page initialization hook
 * Handles authentication, session loading, and redirects
 *
 * @returns Object containing session, loading state, and initialized flag
 *
 * @example
 * ```tsx
 * function MyPage() {
 *   const { session, loading } = usePageInitialization();
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   return <div>Welcome {session?.name}</div>;
 * }
 * ```
 */
export function usePageInitialization() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function initialize() {
      // Check if user is authenticated
      if (!(await isAuthenticated())) {
        router.push('/');
        return;
      }

      // Get session data
      const sessionData = await getSessionAsync();
      setSession(sessionData);

      // Mark as initialized and not loading
      setLoading(false);
      setInitialized(true);
    }

    initialize();
  }, [router]);

  return {
    session,
    loading,
    initialized,
  };
}

/**
 * Extended page initialization hook with custom onInit callback
 * Use when you need to run additional initialization logic after auth
 *
 * @param onInit - Optional callback to run after successful authentication
 * @returns Object containing session, loading state, and initialized flag
 *
 * @example
 * ```tsx
 * function MyPage() {
 *   const { session, loading } = usePageInitializationWithCallback(async (session) => {
 *     // Fetch additional data after authentication
 *     await fetchUserData();
 *   });
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   return <div>Page content</div>;
 * }
 * ```
 */
export function usePageInitializationWithCallback(
  onInit?: (session: Session | null) => Promise<void> | void
) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function initialize() {
      // Check if user is authenticated
      if (!(await isAuthenticated())) {
        router.push('/');
        return;
      }

      // Get session data
      const sessionData = await getSessionAsync();
      setSession(sessionData);

      // Run custom initialization logic if provided
      if (onInit) {
        await onInit(sessionData);
      }

      // Mark as initialized and not loading
      setLoading(false);
      setInitialized(true);
    }

    initialize();
  }, [router, onInit]);

  return {
    session,
    loading,
    initialized,
  };
}

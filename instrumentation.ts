/**
 * Next.js Instrumentation
 * This file runs once when the Next.js server starts
 */

export async function register() {
  // Only run on the server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Dynamically import the scheduler to avoid client-side bundling
    const { startWatcherScheduler } = await import('@/lib/watcher/scheduler');

    try {
      await startWatcherScheduler();
    } catch (error) {
      console.error('[Instrumentation] Failed to start watcher scheduler:', error);
    }
  }
}

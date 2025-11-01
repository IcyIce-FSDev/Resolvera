import cron, { type ScheduledTask } from "node-cron";
import { runBackgroundWatcherCheck } from "./background-checker";
import { getWatcherSettings } from "@/lib/db/database";

/**
 * Global scheduler instance
 */
let schedulerTask: ScheduledTask | null = null;
let currentInterval: number = 5; // Default 5 minutes

/**
 * Convert minutes to cron expression
 * @param minutes - Interval in minutes
 * @returns Cron expression string
 */
function minutesToCron(minutes: number): string {
  if (minutes < 1 || minutes > 1440) {
    throw new Error("Check interval must be between 1 and 1440 minutes");
  }

  // For intervals that divide evenly into 60, use */N format
  if (60 % minutes === 0) {
    return `*/${minutes} * * * *`;
  }

  // For other intervals, we need a more complex approach
  // This creates a list of minutes when the job should run
  const minutesList: number[] = [];
  for (let i = 0; i < 60; i += minutes) {
    minutesList.push(i);
  }

  return `${minutesList.join(",")} * * * *`;
}

/**
 * Start the watcher scheduler
 */
export async function startWatcherScheduler(): Promise<void> {
  try {
    // Stop existing scheduler if running
    if (schedulerTask) {
      schedulerTask.stop();
      schedulerTask = null;
    }

    // Get current settings
    const settings = await getWatcherSettings();
    const checkInterval = settings?.checkIntervalMinutes || 5;
    currentInterval = checkInterval;

    // Create cron expression
    const cronExpression = minutesToCron(checkInterval);

    // Create and start the scheduled task
    schedulerTask = cron.schedule(cronExpression, async () => {
      try {
        const result = await runBackgroundWatcherCheck();

        if (!result.success) {
          console.error(
            `[Watcher Scheduler] Check completed with ${result.errors.length} errors:`,
            result.errors
          );
        }
      } catch (error) {
        console.error(
          "[Watcher Scheduler] Error during scheduled check:",
          error
        );
      }
    });

    // Run an immediate check on startup

    setImmediate(async () => {
      try {
        const result = await runBackgroundWatcherCheck();
      } catch (error) {
        console.error("[Watcher Scheduler] Error during initial check:", error);
      }
    });
  } catch (error) {
    console.error("[Watcher Scheduler] Failed to start scheduler:", error);
    throw error;
  }
}

/**
 * Stop the watcher scheduler
 */
export function stopWatcherScheduler(): void {
  if (schedulerTask) {
    schedulerTask.stop();
    schedulerTask = null;
  }
}

/**
 * Restart the watcher scheduler with updated settings
 */
export async function restartWatcherScheduler(): Promise<void> {
  stopWatcherScheduler();
  await startWatcherScheduler();
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus(): {
  running: boolean;
  interval: number;
} {
  return {
    running: schedulerTask !== null,
    interval: currentInterval,
  };
}

/**
 * Update scheduler interval
 * This should be called when watcher settings are updated
 */
export async function updateSchedulerInterval(
  newInterval: number
): Promise<void> {
  if (newInterval !== currentInterval) {
    await restartWatcherScheduler();
  }
}

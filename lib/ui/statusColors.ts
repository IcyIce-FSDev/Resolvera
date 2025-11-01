/**
 * Centralized color constants for status indicators and badges
 * Provides consistent dark mode support across the application
 */

/**
 * Watcher status badge colors
 * Used in dashboard and watcher pages
 */
export const WATCHER_STATUS_COLORS = {
  ok: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  mismatch: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  disabled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  updating: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
} as const;

/**
 * Watcher status indicator dot colors
 * Used for small status indicators in lists
 */
export const WATCHER_STATUS_DOT_COLORS = {
  ok: 'bg-green-500',
  mismatch: 'bg-yellow-500',
  error: 'bg-red-500',
  disabled: 'bg-gray-400',
  updating: 'bg-blue-500',
} as const;

/**
 * Watcher card border colors
 * Used for watcher cards with visual status indication
 */
export const WATCHER_BORDER_COLORS = {
  ok: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20',
  mismatch: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20',
  error: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20',
  disabled: 'border-gray-200 dark:border-gray-700',
  updating: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20',
} as const;

/**
 * Audit log severity badge colors
 * Used in admin pages and dashboard
 */
export const LOG_SEVERITY_COLORS = {
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  critical: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
} as const;

/**
 * General purpose badge colors
 * Used for type indicators, tags, and labels
 */
export const BADGE_COLORS = {
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
} as const;

/**
 * Get watcher status badge color
 * @param status - Watcher status (ok, mismatch, error, disabled, updating)
 * @returns Tailwind CSS classes for the badge
 */
export function getWatcherStatusColor(status: string | null): string {
  if (!status) return WATCHER_STATUS_COLORS.disabled;
  return WATCHER_STATUS_COLORS[status as keyof typeof WATCHER_STATUS_COLORS] || WATCHER_STATUS_COLORS.disabled;
}

/**
 * Get watcher status dot color
 * @param status - Watcher status
 * @returns Tailwind CSS classes for the status dot
 */
export function getWatcherDotColor(status: string | null): string {
  if (!status) return WATCHER_STATUS_DOT_COLORS.disabled;
  return WATCHER_STATUS_DOT_COLORS[status as keyof typeof WATCHER_STATUS_DOT_COLORS] || WATCHER_STATUS_DOT_COLORS.disabled;
}

/**
 * Get watcher card border color
 * @param status - Watcher status
 * @returns Tailwind CSS classes for the card border and background
 */
export function getWatcherBorderColor(status: string | null): string {
  if (!status) return WATCHER_BORDER_COLORS.disabled;
  return WATCHER_BORDER_COLORS[status as keyof typeof WATCHER_BORDER_COLORS] || WATCHER_BORDER_COLORS.disabled;
}

/**
 * Get audit log severity color
 * @param severity - Log severity (info, warning, error, critical)
 * @returns Tailwind CSS classes for the severity badge
 */
export function getLogSeverityColor(severity: string): string {
  return LOG_SEVERITY_COLORS[severity as keyof typeof LOG_SEVERITY_COLORS] || LOG_SEVERITY_COLORS.info;
}

/**
 * Get general badge color
 * @param color - Color name (blue, green, yellow, red, purple, gray)
 * @returns Tailwind CSS classes for the badge
 */
export function getBadgeColor(color: string): string {
  return BADGE_COLORS[color as keyof typeof BADGE_COLORS] || BADGE_COLORS.gray;
}

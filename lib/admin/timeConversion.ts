// Time conversion utilities for admin settings

export type TimeUnit = 'ms' | 'secs' | 'mins' | 'hrs';

/**
 * Convert a value with a specific time unit to milliseconds
 */
export function convertToMs(value: string, unit: TimeUnit): number {
  const num = parseFloat(value) || 0;
  switch (unit) {
    case 'ms': return num;
    case 'secs': return num * 1000;
    case 'mins': return num * 60 * 1000;
    case 'hrs': return num * 60 * 60 * 1000;
    default: return num;
  }
}

/**
 * Convert milliseconds to a specific time unit
 */
export function convertFromMs(ms: number, targetUnit: TimeUnit): string {
  switch (targetUnit) {
    case 'ms': return ms.toString();
    case 'secs': return (ms / 1000).toString();
    case 'mins': return (ms / (60 * 1000)).toString();
    case 'hrs': return (ms / (60 * 60 * 1000)).toString();
    default: return ms.toString();
  }
}

/**
 * Automatically select the most appropriate time unit for a given millisecond value
 */
export function autoSelectUnit(ms: number): TimeUnit {
  if (ms < 1000) return 'ms';
  if (ms < 60000) return 'secs';
  if (ms < 3600000) return 'mins';
  return 'hrs';
}

/**
 * Format milliseconds to a human-readable string with appropriate unit
 */
export function formatTime(ms: number): string {
  const unit = autoSelectUnit(ms);
  const value = convertFromMs(ms, unit);
  return `${value} ${unit}`;
}

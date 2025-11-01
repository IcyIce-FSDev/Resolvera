// Main database export file
// Exports all database operations and Prisma client

export * from './prisma';
export * from './database';

// Re-export commonly used types
export type {
  User,
  Zone,
  Watcher,
  AuditLog,
  WatcherSettings,
  UserPreferences,
} from '@prisma/client';

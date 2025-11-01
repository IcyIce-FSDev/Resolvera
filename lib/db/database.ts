// Database layer using Prisma ORM
// Replaces the file-based JSON database with PostgreSQL

import { prisma } from './prisma';
import type { User, Zone, Watcher, AuditLog, WatcherSettings, UserPreferences } from '@prisma/client';

// ========== USER OPERATIONS ==========

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  assignedZoneIds?: string[];
}) {
  return await prisma.user.create({
    data: {
      ...data,
      assignedZoneIds: data.assignedZoneIds || [],
    },
  });
}

export async function getUserById(id: string) {
  return await prisma.user.findUnique({
    where: { id },
  });
}

export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
  });
}

export async function getAllUsers() {
  return await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateUser(id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>) {
  return await prisma.user.update({
    where: { id },
    data,
  });
}

export async function deleteUser(id: string) {
  return await prisma.user.delete({
    where: { id },
  });
}

// ========== ZONE OPERATIONS ==========

export async function createZone(data: {
  zoneName: string;
  zoneId: string;
  apiToken: string;
}) {
  return await prisma.zone.create({
    data,
  });
}

export async function getZoneById(id: string) {
  return await prisma.zone.findUnique({
    where: { id },
  });
}

export async function getZoneByZoneId(zoneId: string) {
  return await prisma.zone.findUnique({
    where: { zoneId },
  });
}

export async function getZoneByZoneName(zoneName: string) {
  return await prisma.zone.findUnique({
    where: { zoneName },
  });
}

export async function getAllZones() {
  return await prisma.zone.findMany({
    orderBy: { zoneName: 'asc' },
    include: {
      watchers: true,
    },
  });
}

export async function updateZone(id: string, data: Partial<Omit<Zone, 'id' | 'createdAt'>>) {
  return await prisma.zone.update({
    where: { id },
    data,
  });
}

export async function deleteZone(id: string) {
  return await prisma.zone.delete({
    where: { id },
  });
}

// ========== WATCHER OPERATIONS ==========

export async function createWatcher(data: {
  recordName: string;
  recordType: string;
  zoneName: string;
  enabled?: boolean;
  status?: string;
  currentIP?: string;
  expectedIP?: string;
  zoneId?: string;
}) {
  return await prisma.watcher.create({
    data,
  });
}

export async function getWatcherById(id: string) {
  return await prisma.watcher.findUnique({
    where: { id },
    include: {
      zone: true,
    },
  });
}

export async function getAllWatchers() {
  return await prisma.watcher.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      zone: true,
    },
  });
}

export async function getEnabledWatchers() {
  return await prisma.watcher.findMany({
    where: { enabled: true },
    include: {
      zone: true,
    },
  });
}

export async function getWatchersByZone(zoneName: string) {
  return await prisma.watcher.findMany({
    where: { zoneName },
    include: {
      zone: true,
    },
  });
}

export async function updateWatcher(id: string, data: Partial<Omit<Watcher, 'id' | 'createdAt'>>) {
  return await prisma.watcher.update({
    where: { id },
    data,
  });
}

export async function deleteWatcher(id: string) {
  return await prisma.watcher.delete({
    where: { id },
  });
}

// ========== AUDIT LOG OPERATIONS ==========

export async function createAuditLog(data: {
  action: string;
  severity: string;
  ip?: string;
  userAgent?: string;
  resource?: string;
  resourceId?: string;
  details?: any;
  success?: boolean;
  userId?: string;
}) {
  return await prisma.auditLog.create({
    data,
  });
}

export async function getAuditLogs(filters?: {
  userId?: string;
  action?: string;
  severity?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  const where: any = {};

  if (filters?.userId) where.userId = filters.userId;
  if (filters?.action) where.action = { contains: filters.action, mode: 'insensitive' };
  if (filters?.severity) where.severity = filters.severity;

  if (filters?.startDate || filters?.endDate) {
    where.timestamp = {};
    if (filters.startDate) where.timestamp.gte = filters.startDate;
    if (filters.endDate) where.timestamp.lte = filters.endDate;
  }

  return await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: filters?.limit || 100,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function deleteOldAuditLogs(daysOld: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return await prisma.auditLog.deleteMany({
    where: {
      timestamp: {
        lt: cutoffDate,
      },
    },
  });
}

// ========== WATCHER SETTINGS OPERATIONS ==========

export async function getWatcherSettings() {
  // Get the first (and should be only) watcher settings record
  return await prisma.watcherSettings.findFirst();
}

export async function createWatcherSettings(data: {
  checkIntervalMinutes: number;
  autoUpdateEnabled: boolean;
  notifyOnMismatch: boolean;
}) {
  return await prisma.watcherSettings.create({
    data,
  });
}

export async function updateWatcherSettings(id: string, data: Partial<Omit<WatcherSettings, 'id' | 'createdAt' | 'updatedAt'>>) {
  return await prisma.watcherSettings.update({
    where: { id },
    data,
  });
}

// ========== USER PREFERENCES OPERATIONS ==========

export async function getUserPreferences(userId: string) {
  let prefs = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  // Create default preferences if none exist
  if (!prefs) {
    prefs = await prisma.userPreferences.create({
      data: {
        userId,
        theme: 'light',
        language: 'en',
      },
    });
  }

  return prefs;
}

export async function updateUserPreferences(
  userId: string,
  data: {
    theme?: string;
    language?: string;
    settings?: any;
  }
) {
  return await prisma.userPreferences.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      theme: data.theme || 'light',
      language: data.language || 'en',
      settings: data.settings || null,
    },
  });
}


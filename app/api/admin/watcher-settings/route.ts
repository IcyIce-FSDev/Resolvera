import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthenticatedRequest } from '@/lib/auth/middleware';
import { getWatcherSettings, createWatcherSettings, updateWatcherSettings } from '@/lib/db/database';
import { createAuditLog, getUserInfoFromRequest } from '@/lib/audit/logger';
import { updateSchedulerInterval } from '@/lib/watcher/scheduler';

interface WatcherSettings {
  enabled: boolean;
  checkInterval: number; // in minutes
  autoUpdate: boolean; // automatically update DNS records if mismatch
  notifyOnMismatch: boolean;
}

const DEFAULT_SETTINGS: WatcherSettings = {
  enabled: true,
  checkInterval: 5,
  autoUpdate: false,
  notifyOnMismatch: true,
};

// Get watcher settings
export async function GET(request: NextRequest) {
  return requireAdmin(request, async (_req: AuthenticatedRequest) => {
    try {
      const settingsData = await getWatcherSettings();

      if (!settingsData) {
        // Return defaults if no settings exist
        return NextResponse.json({
          success: true,
          data: DEFAULT_SETTINGS,
        });
      }

      // Convert database format to API format
      const settings = {
        enabled: true, // Assume enabled if settings exist
        checkInterval: settingsData.checkIntervalMinutes,
        autoUpdate: settingsData.autoUpdateEnabled,
        notifyOnMismatch: settingsData.notifyOnMismatch,
      };

      return NextResponse.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      console.error('Error reading watcher settings:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to read watcher settings',
        },
        { status: 500 }
      );
    }
  });
}

// Update watcher settings
export async function PATCH(request: NextRequest) {
  return requireAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const { enabled, checkInterval, autoUpdate, notifyOnMismatch } = body;

    // Validate checkInterval
    if (checkInterval !== undefined) {
      if (typeof checkInterval !== 'number' || checkInterval < 1 || checkInterval > 1440) {
        return NextResponse.json(
          {
            success: false,
            error: 'Check interval must be between 1 and 1440 minutes (24 hours)',
          },
          { status: 400 }
        );
      }
    }

    // Get current settings
    const currentSettings = await getWatcherSettings();

    // Build update data
    const updateData: any = {};
    if (checkInterval !== undefined) updateData.checkIntervalMinutes = checkInterval;
    if (autoUpdate !== undefined) updateData.autoUpdateEnabled = autoUpdate;
    if (notifyOnMismatch !== undefined) updateData.notifyOnMismatch = notifyOnMismatch;

    let settings;
    if (currentSettings) {
      // Update existing settings
      settings = await updateWatcherSettings(currentSettings.id, updateData);
    } else {
      // Create new settings
      settings = await createWatcherSettings({
        checkIntervalMinutes: checkInterval !== undefined ? checkInterval : DEFAULT_SETTINGS.checkInterval,
        autoUpdateEnabled: autoUpdate !== undefined ? autoUpdate : DEFAULT_SETTINGS.autoUpdate,
        notifyOnMismatch: notifyOnMismatch !== undefined ? notifyOnMismatch : DEFAULT_SETTINGS.notifyOnMismatch,
      });
    }

    // Convert to API format
    const responseSettings = {
      enabled: true,
      checkInterval: settings.checkIntervalMinutes,
      autoUpdate: settings.autoUpdateEnabled,
      notifyOnMismatch: settings.notifyOnMismatch,
    };

      // Update scheduler interval if check interval changed
      if (checkInterval !== undefined) {
        await updateSchedulerInterval(checkInterval);
      }

      // Create audit log
      const userInfo = getUserInfoFromRequest(request, req.user);
      await createAuditLog({
        action: 'watcher.settings.updated',
        ...userInfo,
        resource: 'watcher_settings',
        resourceId: settings.id,
        details: {
          checkInterval: settings.checkIntervalMinutes,
          autoUpdate: settings.autoUpdateEnabled,
          notifyOnMismatch: settings.notifyOnMismatch,
        },
        success: true,
      });

      return NextResponse.json({
        success: true,
        data: responseSettings,
      });
    } catch (error) {
      console.error('Error updating watcher settings:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update watcher settings',
        },
        { status: 500 }
      );
    }
  });
}

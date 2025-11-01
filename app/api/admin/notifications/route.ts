import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthenticatedRequest } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/prisma';
import { createAuditLog, getUserInfoFromRequest } from '@/lib/audit/logger';

/**
 * GET /api/admin/notifications
 * Get notification settings
 */
export async function GET(request: NextRequest) {
  return requireAdmin(request, async (_req: AuthenticatedRequest) => {
    try {
      // Get or create notification settings
      let settings = await prisma.notificationSettings.findFirst();

      if (!settings) {
        // Create default settings if none exist
        settings = await prisma.notificationSettings.create({
          data: {
            dnsRecordAdd: true,
            dnsRecordEdit: true,
            dnsRecordDelete: true,
            watcherAdd: true,
            watcherEdit: true,
            watcherDelete: true,
            watcherIpUpdateManual: true,
            watcherIpUpdateAuto: true,
            discordWebhookEnabled: false,
            discordWebhookUrl: null,
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      console.error('[API] Error getting notification settings:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to get notification settings' },
        { status: 500 }
      );
    }
  });
}

/**
 * PUT /api/admin/notifications
 * Update notification settings
 */
export async function PUT(request: NextRequest) {
  return requireAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();

      // Validate webhook URL if Discord is enabled
      if (body.discordWebhookEnabled) {
        if (!body.discordWebhookUrl || body.discordWebhookUrl.trim() === '') {
          return NextResponse.json(
            { error: 'Webhook URL is required when Discord notifications are enabled' },
            { status: 400 }
          );
        }

        try {
          const url = new URL(body.discordWebhookUrl);
          if (!url.hostname.includes('discord.com')) {
            return NextResponse.json(
              { error: 'Invalid Discord webhook URL - must be a discord.com URL' },
              { status: 400 }
            );
          }
        } catch {
          return NextResponse.json(
            { error: 'Invalid webhook URL format' },
            { status: 400 }
          );
        }
      }

      // Get existing settings or create new
      let settings = await prisma.notificationSettings.findFirst();

      if (!settings) {
        // Create new settings
        settings = await prisma.notificationSettings.create({
          data: {
            dnsRecordAdd: body.dnsRecordAdd ?? true,
            dnsRecordEdit: body.dnsRecordEdit ?? true,
            dnsRecordDelete: body.dnsRecordDelete ?? true,
            watcherAdd: body.watcherAdd ?? true,
            watcherEdit: body.watcherEdit ?? true,
            watcherDelete: body.watcherDelete ?? true,
            watcherIpUpdateManual: body.watcherIpUpdateManual ?? true,
            watcherIpUpdateAuto: body.watcherIpUpdateAuto ?? true,
            discordWebhookEnabled: body.discordWebhookEnabled ?? false,
            discordWebhookUrl: body.discordWebhookUrl || null,
          },
        });
      } else {
        // Update existing settings
        settings = await prisma.notificationSettings.update({
          where: { id: settings.id },
          data: {
            dnsRecordAdd: body.dnsRecordAdd,
            dnsRecordEdit: body.dnsRecordEdit,
            dnsRecordDelete: body.dnsRecordDelete,
            watcherAdd: body.watcherAdd,
            watcherEdit: body.watcherEdit,
            watcherDelete: body.watcherDelete,
            watcherIpUpdateManual: body.watcherIpUpdateManual,
            watcherIpUpdateAuto: body.watcherIpUpdateAuto,
            discordWebhookEnabled: body.discordWebhookEnabled,
            discordWebhookUrl: body.discordWebhookUrl || null,
          },
        });
      }

      // Create audit log
      const userInfo = getUserInfoFromRequest(request, req.user);
      await createAuditLog({
        action: 'notifications.settings.updated',
        ...userInfo,
        resource: 'notification_settings',
        resourceId: settings.id,
        details: {
          discordEnabled: body.discordWebhookEnabled,
          webhookUrlProvided: body.discordWebhookUrl ? true : false,
          dnsEventsEnabled: {
            add: body.dnsRecordAdd,
            edit: body.dnsRecordEdit,
            delete: body.dnsRecordDelete,
          },
          watcherEventsEnabled: {
            add: body.watcherAdd,
            edit: body.watcherEdit,
            delete: body.watcherDelete,
            ipUpdateManual: body.watcherIpUpdateManual,
            ipUpdateAuto: body.watcherIpUpdateAuto,
          },
        },
        success: true,
      });

      return NextResponse.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      console.error('[API] Error updating notification settings:', error);

      // Create failure audit log
      const userInfo = getUserInfoFromRequest(request, req.user);
      await createAuditLog({
        action: 'notifications.settings.updated',
        ...userInfo,
        resource: 'notification_settings',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return NextResponse.json(
        { success: false, error: 'Failed to update notification settings' },
        { status: 500 }
      );
    }
  });
}

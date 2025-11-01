/*
  Warnings:

  - You are about to drop the column `checkIntervalMs` on the `watcher_settings` table. All the data in the column will be lost.
  - You are about to drop the column `enabledByDefault` on the `watcher_settings` table. All the data in the column will be lost.
  - You are about to drop the column `ipDetectionServices` on the `watcher_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "watcher_settings" DROP COLUMN "checkIntervalMs",
DROP COLUMN "enabledByDefault",
DROP COLUMN "ipDetectionServices",
ADD COLUMN     "autoUpdateEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "checkIntervalMinutes" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "notifyOnMismatch" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" TEXT NOT NULL,
    "dnsRecordAdd" BOOLEAN NOT NULL DEFAULT true,
    "dnsRecordEdit" BOOLEAN NOT NULL DEFAULT true,
    "dnsRecordDelete" BOOLEAN NOT NULL DEFAULT true,
    "watcherAdd" BOOLEAN NOT NULL DEFAULT true,
    "watcherEdit" BOOLEAN NOT NULL DEFAULT true,
    "watcherDelete" BOOLEAN NOT NULL DEFAULT true,
    "watcherIpUpdateManual" BOOLEAN NOT NULL DEFAULT true,
    "watcherIpUpdateAuto" BOOLEAN NOT NULL DEFAULT true,
    "discordWebhookEnabled" BOOLEAN NOT NULL DEFAULT false,
    "discordWebhookUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

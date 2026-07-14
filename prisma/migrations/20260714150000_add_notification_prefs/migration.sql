-- AlterTable
ALTER TABLE "users" ADD COLUMN     "receiveNotifications" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "notificationDays" TEXT;

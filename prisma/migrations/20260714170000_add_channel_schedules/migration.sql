-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "notificationTime" TEXT,
ADD COLUMN     "smtpEnabled" BOOLEAN,
ADD COLUMN     "telegramEnabled" BOOLEAN,
ADD COLUMN     "telegramDays" TEXT,
ADD COLUMN     "telegramTime" TEXT;

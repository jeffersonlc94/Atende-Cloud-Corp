-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "smtpHost" TEXT,
ADD COLUMN     "smtpPort" INTEGER,
ADD COLUMN     "smtpUser" TEXT,
ADD COLUMN     "smtpPass" TEXT,
ADD COLUMN     "smtpSecure" BOOLEAN,
ADD COLUMN     "smtpFrom" TEXT,
ADD COLUMN     "notificationEmails" TEXT;

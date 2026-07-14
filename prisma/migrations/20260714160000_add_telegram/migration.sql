-- AlterTable
ALTER TABLE "users" ADD COLUMN     "telegramChatId" TEXT;

-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "telegramBotToken" TEXT,
ADD COLUMN     "telegramChatIds" TEXT;

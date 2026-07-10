-- CreateEnum
CREATE TYPE "Cargo" AS ENUM ('TECNICO', 'VENDEDOR');

-- CreateEnum
CREATE TYPE "Visibilidade" AS ENUM ('Global', 'Privado');

-- AlterTable
ALTER TABLE "users"
  ADD COLUMN "cargo" "Cargo",
  ADD COLUMN "avatarUrl" TEXT,
  ADD COLUMN "canAccessOrcamentos" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "canAccessFrota" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "quotes"
  ADD COLUMN "visibilidade" "Visibilidade" NOT NULL DEFAULT 'Global';

-- AlterTable
ALTER TABLE "system_settings"
  ADD COLUMN "autoLogoutMinutes" INTEGER,
  ADD COLUMN "notificationCargoPrefs" JSONB;

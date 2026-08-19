ALTER TABLE "users" ADD COLUMN "canAccessTreinamentos" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "system_settings"
  ADD COLUMN "trainingVideoMaxMb" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "trainingDocumentMaxMb" INTEGER NOT NULL DEFAULT 50;

CREATE TYPE "TrainingContentType" AS ENUM ('Videoaula', 'Documento');

CREATE TABLE "training_categories" (
  "id" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "training_categories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "training_categories_nome_key" ON "training_categories"("nome");
INSERT INTO "training_categories" ("id", "nome", "createdAt", "updatedAt") VALUES
  ('training-category-sgbr', 'SGBR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('training-category-rhid', 'RHID', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

CREATE TABLE "training_contents" (
  "id" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "descricao" TEXT,
  "tipo" "TrainingContentType" NOT NULL,
  "arquivoUrl" TEXT NOT NULL,
  "nomeArquivo" TEXT,
  "ordem" INTEGER NOT NULL DEFAULT 0,
  "categoryId" TEXT NOT NULL,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "training_contents_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "training_contents_categoryId_tipo_ordem_idx" ON "training_contents"("categoryId", "tipo", "ordem");
ALTER TABLE "training_contents" ADD CONSTRAINT "training_contents_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "training_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "training_contents" ADD CONSTRAINT "training_contents_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "user_presences" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "path" TEXT,
  "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_presences_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "user_presences_userId_key" ON "user_presences"("userId");
CREATE INDEX "user_presences_lastSeen_idx" ON "user_presences"("lastSeen");
ALTER TABLE "user_presences" ADD CONSTRAINT "user_presences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

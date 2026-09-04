ALTER TABLE "users"
  ADD COLUMN "canAccessArquivosTecnicos" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "system_settings"
  ADD COLUMN "technicalFileMaxMb" INTEGER NOT NULL DEFAULT 500;

CREATE TYPE "TechnicalFileType" AS ENUM ('Driver', 'Firmware', 'Manual', 'Utilitario', 'Outro');

CREATE TABLE "technical_categories" (
  "id" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "technical_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "technical_files" (
  "id" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "descricao" TEXT,
  "tipo" "TechnicalFileType" NOT NULL DEFAULT 'Driver',
  "fabricante" TEXT,
  "produto" TEXT NOT NULL,
  "versao" TEXT,
  "sistemaOperacional" TEXT,
  "nomeOriginal" TEXT NOT NULL,
  "nomeArmazenado" TEXT NOT NULL,
  "mimeType" TEXT,
  "tamanhoBytes" INTEGER NOT NULL,
  "categoryId" TEXT NOT NULL,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "technical_files_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "technical_categories_nome_key" ON "technical_categories"("nome");
CREATE UNIQUE INDEX "technical_files_nomeArmazenado_key" ON "technical_files"("nomeArmazenado");
CREATE INDEX "technical_files_categoryId_tipo_idx" ON "technical_files"("categoryId", "tipo");
CREATE INDEX "technical_files_fabricante_idx" ON "technical_files"("fabricante");
CREATE INDEX "technical_files_produto_idx" ON "technical_files"("produto");

ALTER TABLE "technical_files"
  ADD CONSTRAINT "technical_files_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "technical_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "technical_files"
  ADD CONSTRAINT "technical_files_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "technical_categories" ("id", "nome", "createdAt", "updatedAt")
VALUES
  ('technical-category-impressoras', 'Impressoras', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('technical-category-balancas', 'Balanças', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('technical-category-outros', 'Outros equipamentos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("nome") DO NOTHING;

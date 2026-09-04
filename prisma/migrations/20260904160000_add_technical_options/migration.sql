CREATE TYPE "TechnicalOptionKind" AS ENUM ('Fabricante', 'Produto', 'SistemaOperacional');

CREATE TABLE "technical_options" (
  "id" TEXT NOT NULL,
  "kind" "TechnicalOptionKind" NOT NULL,
  "nome" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "technical_options_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "technical_options_kind_nome_key" ON "technical_options"("kind", "nome");
CREATE INDEX "technical_options_kind_nome_idx" ON "technical_options"("kind", "nome");

INSERT INTO "technical_options" ("id", "kind", "nome", "createdAt", "updatedAt")
SELECT 'technical-manufacturer-' || md5("fabricante"), 'Fabricante', "fabricante", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "technical_files" WHERE "fabricante" IS NOT NULL AND trim("fabricante") <> ''
GROUP BY "fabricante"
ON CONFLICT ("kind", "nome") DO NOTHING;

INSERT INTO "technical_options" ("id", "kind", "nome", "createdAt", "updatedAt")
SELECT 'technical-product-' || md5("produto"), 'Produto', "produto", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "technical_files" WHERE trim("produto") <> ''
GROUP BY "produto"
ON CONFLICT ("kind", "nome") DO NOTHING;

INSERT INTO "technical_options" ("id", "kind", "nome", "createdAt", "updatedAt")
SELECT 'technical-os-' || md5("sistemaOperacional"), 'SistemaOperacional', "sistemaOperacional", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "technical_files" WHERE "sistemaOperacional" IS NOT NULL AND trim("sistemaOperacional") <> ''
GROUP BY "sistemaOperacional"
ON CONFLICT ("kind", "nome") DO NOTHING;

-- AlterTable
ALTER TABLE "vehicles"
  ADD COLUMN "nome" TEXT,
  ADD COLUMN "categoria" TEXT,
  ADD COLUMN "capacidadeCarga" INTEGER,
  ADD COLUMN "potencia" INTEGER,
  ADD COLUMN "tracao" TEXT,
  ADD COLUMN "oilChangeIntervalKm" INTEGER,
  ADD COLUMN "tipoUso" TEXT,
  ADD COLUMN "valorAquisicao" DECIMAL(14,2),
  ADD COLUMN "observacoesAdicionais" TEXT;

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Pendente';

-- Backfill: lançamentos já devolvidos recebem o status correspondente
UPDATE "stock_movements" SET "status" = 'Devolvido' WHERE "devolvido" = true;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "canAccessEstoque" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "cod" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "qtd" INTEGER NOT NULL DEFAULT 1,
    "respRetirada" TEXT NOT NULL,
    "respEntrega" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "numeroSerie" TEXT,
    "destino" TEXT,
    "devolvido" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_movements_data_idx" ON "stock_movements"("data");

-- CreateIndex
CREATE INDEX "stock_movements_cod_idx" ON "stock_movements"("cod");

-- CreateIndex
CREATE INDEX "stock_movements_numeroSerie_idx" ON "stock_movements"("numeroSerie");

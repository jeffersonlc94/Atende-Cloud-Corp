-- CreateEnum
CREATE TYPE "DescontoTipo" AS ENUM ('Valor', 'Percentual');

-- AlterTable
ALTER TABLE "quote_items" ADD COLUMN     "descontoTipo" "DescontoTipo",
ADD COLUMN     "descontoValor" DECIMAL(14,2);

-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "descontoGeralTipo" "DescontoTipo",
ADD COLUMN     "descontoGeralValor" DECIMAL(14,2),
ADD COLUMN     "subtotal" DECIMAL(14,2);

-- CreateEnum
CREATE TYPE "TipoItem" AS ENUM ('Produto', 'Servico');

-- AlterTable
ALTER TABLE "quote_items" ADD COLUMN     "tipoItem" "TipoItem" NOT NULL DEFAULT 'Produto';

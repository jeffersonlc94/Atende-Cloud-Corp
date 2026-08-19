CREATE TYPE "QuoteStatus" AS ENUM ('Negociacao', 'Enviado', 'NaoAprovado', 'Aprovado');
ALTER TABLE "quotes" ADD COLUMN "status" "QuoteStatus" NOT NULL DEFAULT 'Negociacao';

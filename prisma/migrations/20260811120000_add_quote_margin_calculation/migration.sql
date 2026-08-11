ALTER TABLE "quote_items"
ADD COLUMN "calcularPorMargem" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "custoUnitario" DECIMAL(14,2),
ADD COLUMN "margemLucro" DECIMAL(8,2);

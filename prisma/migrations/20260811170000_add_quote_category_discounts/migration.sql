ALTER TABLE "quotes"
ADD COLUMN "descontoProdutosTipo" "DescontoTipo",
ADD COLUMN "descontoProdutosValor" DECIMAL(14,2),
ADD COLUMN "descontoServicosTipo" "DescontoTipo",
ADD COLUMN "descontoServicosValor" DECIMAL(14,2);

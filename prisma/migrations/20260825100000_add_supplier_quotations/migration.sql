ALTER TABLE "users" ADD COLUMN "canAccessCotacoes" BOOLEAN NOT NULL DEFAULT true;

CREATE TYPE "SupplierQuotationType" AS ENUM ('FornecedorUnico', 'MultiplosFornecedores');
CREATE TYPE "SupplierQuotationStatus" AS ENUM ('Rascunho', 'EmCotacao', 'Recebida', 'Aprovada', 'NaoAprovada', 'Finalizada');

CREATE TABLE "suppliers" (
  "id" TEXT NOT NULL,
  "razaoSocial" TEXT NOT NULL,
  "nomeFantasia" TEXT,
  "cnpjCpf" TEXT,
  "telefone" TEXT,
  "email" TEXT,
  "endereco" TEXT,
  "contato" TEXT,
  "observacoes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "supplier_quotations" (
  "id" TEXT NOT NULL,
  "numero" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "tipo" "SupplierQuotationType" NOT NULL DEFAULT 'FornecedorUnico',
  "primarySupplierId" TEXT,
  "referencia" TEXT,
  "dataCotacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "observacoes" TEXT,
  "observacoesInternas" TEXT,
  "status" "SupplierQuotationStatus" NOT NULL DEFAULT 'EmCotacao',
  "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "createdByUserId" TEXT,
  "updatedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "supplier_quotations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "supplier_quotation_items" (
  "id" TEXT NOT NULL,
  "quotationId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "ordem" INTEGER NOT NULL,
  "codigoProduto" TEXT,
  "codigoFornecedor" TEXT,
  "descricao" TEXT NOT NULL,
  "quantidade" DECIMAL(14,3) NOT NULL,
  "valorUnitario" DECIMAL(14,2) NOT NULL,
  "observacao" TEXT,
  "valorTotal" DECIMAL(14,2) NOT NULL,
  CONSTRAINT "supplier_quotation_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "supplier_quotation_counter" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "lastNum" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "supplier_quotation_counter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "supplier_quotations_numero_key" ON "supplier_quotations"("numero");
CREATE INDEX "suppliers_razaoSocial_idx" ON "suppliers"("razaoSocial");
CREATE INDEX "supplier_quotations_dataCotacao_idx" ON "supplier_quotations"("dataCotacao");
CREATE INDEX "supplier_quotations_status_idx" ON "supplier_quotations"("status");
CREATE INDEX "supplier_quotation_items_quotationId_ordem_idx" ON "supplier_quotation_items"("quotationId", "ordem");
CREATE INDEX "supplier_quotation_items_supplierId_idx" ON "supplier_quotation_items"("supplierId");

ALTER TABLE "supplier_quotations" ADD CONSTRAINT "supplier_quotations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "supplier_quotations" ADD CONSTRAINT "supplier_quotations_primarySupplierId_fkey" FOREIGN KEY ("primarySupplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "supplier_quotations" ADD CONSTRAINT "supplier_quotations_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "supplier_quotations" ADD CONSTRAINT "supplier_quotations_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "supplier_quotation_items" ADD CONSTRAINT "supplier_quotation_items_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "supplier_quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "supplier_quotation_items" ADD CONSTRAINT "supplier_quotation_items_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

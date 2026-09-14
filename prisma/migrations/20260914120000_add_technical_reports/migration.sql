CREATE TYPE "TechnicalReportStatus" AS ENUM ('Rascunho', 'Finalizado');

CREATE TABLE "technical_reports" (
  "id" TEXT NOT NULL,
  "numero" TEXT NOT NULL,
  "dataEmissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" "TechnicalReportStatus" NOT NULL DEFAULT 'Rascunho',
  "companyId" TEXT NOT NULL,
  "clienteCodigo" TEXT,
  "clienteNome" TEXT NOT NULL,
  "clienteFantasia" TEXT,
  "clienteEndereco" TEXT,
  "clienteNumero" TEXT,
  "clienteBairro" TEXT,
  "clienteCidade" TEXT,
  "clienteUf" TEXT,
  "clienteTelefone" TEXT,
  "clienteDocumento" TEXT,
  "equipamento" TEXT NOT NULL,
  "numeroSerie" TEXT,
  "modelo" TEXT,
  "equipamentoObservacao" TEXT,
  "problema" TEXT,
  "problemaRelatado" TEXT,
  "problemasEncontrados" TEXT,
  "procedimentosRealizados" TEXT,
  "createdByUserId" TEXT NOT NULL,
  "updatedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "technical_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "technical_report_counter" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "lastNum" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "technical_report_counter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "technical_reports_numero_key" ON "technical_reports"("numero");
CREATE INDEX "technical_reports_dataEmissao_idx" ON "technical_reports"("dataEmissao");
CREATE INDEX "technical_reports_clienteNome_idx" ON "technical_reports"("clienteNome");
CREATE INDEX "technical_reports_createdByUserId_idx" ON "technical_reports"("createdByUserId");
ALTER TABLE "technical_reports" ADD CONSTRAINT "technical_reports_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "technical_reports" ADD CONSTRAINT "technical_reports_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "technical_reports" ADD CONSTRAINT "technical_reports_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "Combustivel" AS ENUM ('Gasolina', 'Etanol', 'Flex', 'Diesel', 'GNV', 'Eletrico', 'Hibrido');

-- CreateEnum
CREATE TYPE "SituacaoVeiculo" AS ENUM ('Ativo', 'Inativo', 'Manutencao');

-- CreateEnum
CREATE TYPE "TipoDocumentoVeiculo" AS ENUM ('CRLV', 'Seguro', 'IPVA', 'Licenciamento', 'Outro');

-- CreateEnum
CREATE TYPE "TipoChecklist" AS ENUM ('Diario', 'Semanal', 'Mensal');

-- CreateEnum
CREATE TYPE "ChecklistItemTipo" AS ENUM ('Pneus', 'Freios', 'Luzes', 'Oleo', 'Agua', 'Motor', 'Suspensao', 'Bateria', 'Documentacao');

-- CreateEnum
CREATE TYPE "ChecklistItemStatus" AS ENUM ('OK', 'Atencao', 'NecessitaManutencao');

-- CreateEnum
CREATE TYPE "TipoEventoAgenda" AS ENUM ('Manutencao', 'TrocaOleo', 'Documento', 'Checklist', 'Outro');

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "placa" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "versao" TEXT,
    "ano" INTEGER NOT NULL,
    "cor" TEXT,
    "renavam" TEXT,
    "chassi" TEXT,
    "combustivel" "Combustivel" NOT NULL DEFAULT 'Flex',
    "companyId" TEXT NOT NULL,
    "kmAtual" INTEGER NOT NULL DEFAULT 0,
    "situacao" "SituacaoVeiculo" NOT NULL DEFAULT 'Ativo',
    "dataAquisicao" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_documents" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "tipo" "TipoDocumentoVeiculo" NOT NULL DEFAULT 'Outro',
    "arquivoUrl" TEXT,
    "dataEmissao" TIMESTAMP(3),
    "dataVencimento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mileage_logs" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "km" INTEGER NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mileage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oil_changes" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "km" INTEGER NOT NULL,
    "tipoOleo" TEXT,
    "quantidade" DECIMAL(10,2),
    "oficina" TEXT,
    "valor" DECIMAL(14,2),
    "observacoes" TEXT,
    "kmProximaTroca" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oil_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenances" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "oficina" TEXT,
    "valor" DECIMAL(14,2),
    "km" INTEGER,
    "responsavelUserId" TEXT,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklists" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "tipo" "TipoChecklist" NOT NULL DEFAULT 'Diario',
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hora" TEXT,
    "km" INTEGER,
    "userId" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "item" "ChecklistItemTipo" NOT NULL,
    "status" "ChecklistItemStatus" NOT NULL DEFAULT 'OK',

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuels" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "km" INTEGER,
    "litros" DECIMAL(10,3) NOT NULL,
    "valorLitro" DECIMAL(10,3) NOT NULL,
    "valorTotal" DECIMAL(14,2) NOT NULL,
    "posto" TEXT,
    "tipoCombustivel" "Combustivel" NOT NULL DEFAULT 'Flex',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fuels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT,
    "titulo" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoEventoAgenda" NOT NULL DEFAULT 'Outro',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_placa_key" ON "vehicles"("placa");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mileage_logs" ADD CONSTRAINT "mileage_logs_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mileage_logs" ADD CONSTRAINT "mileage_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oil_changes" ADD CONSTRAINT "oil_changes_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenances" ADD CONSTRAINT "maintenances_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenances" ADD CONSTRAINT "maintenances_responsavelUserId_fkey" FOREIGN KEY ("responsavelUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuels" ADD CONSTRAINT "fuels_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

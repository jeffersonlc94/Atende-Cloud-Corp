-- Impede que reenvios do mesmo rascunho criem orçamentos duplicados.
ALTER TABLE "quotes" ADD COLUMN "sourceDraftId" TEXT;
CREATE UNIQUE INDEX "quotes_sourceDraftId_key" ON "quotes"("sourceDraftId");

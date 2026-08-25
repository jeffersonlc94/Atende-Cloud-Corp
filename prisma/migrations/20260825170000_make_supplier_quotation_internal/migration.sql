ALTER TABLE "supplier_quotations" ALTER COLUMN "companyId" DROP NOT NULL;
ALTER TABLE "supplier_quotations" ADD COLUMN "fotosInternas" JSONB NOT NULL DEFAULT '[]';

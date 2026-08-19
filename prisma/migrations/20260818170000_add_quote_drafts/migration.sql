CREATE TABLE "quote_drafts" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "autoSave" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "quote_drafts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "quote_drafts_createdByUserId_updatedAt_idx" ON "quote_drafts"("createdByUserId", "updatedAt");
ALTER TABLE "quote_drafts" ADD CONSTRAINT "quote_drafts_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

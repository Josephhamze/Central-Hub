-- AlterTable
ALTER TABLE "quotes" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "archived_at" TIMESTAMP(3),
ADD COLUMN "expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "quotes_archived_idx" ON "quotes"("archived");

-- CreateIndex
CREATE INDEX "quotes_expires_at_idx" ON "quotes"("expires_at");

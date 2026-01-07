-- AlterTable
ALTER TABLE "routes" ADD COLUMN "warehouse_id" TEXT;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "routes_warehouse_id_idx" ON "routes"("warehouse_id");

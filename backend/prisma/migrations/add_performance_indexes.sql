-- Add performance indexes for StockItem and Quote

-- StockItem indexes
CREATE INDEX IF NOT EXISTS "stock_items_name_idx" ON "stock_items"("name");
CREATE INDEX IF NOT EXISTS "stock_items_is_active_idx" ON "stock_items"("is_active");
CREATE INDEX IF NOT EXISTS "stock_items_sku_idx" ON "stock_items"("sku") WHERE "sku" IS NOT NULL;

-- Quote indexes
CREATE INDEX IF NOT EXISTS "quotes_created_at_idx" ON "quotes"("created_at");

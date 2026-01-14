-- Add projectId to all quarry production entries (nullable first, will be populated)
ALTER TABLE "excavator_entries" ADD COLUMN IF NOT EXISTS "project_id" TEXT;
ALTER TABLE "hauling_entries" ADD COLUMN IF NOT EXISTS "project_id" TEXT;
ALTER TABLE "crusher_feed_entries" ADD COLUMN IF NOT EXISTS "project_id" TEXT;
ALTER TABLE "crusher_output_entries" ADD COLUMN IF NOT EXISTS "project_id" TEXT;
ALTER TABLE "stock_levels" ADD COLUMN IF NOT EXISTS "project_id" TEXT;

-- If there's existing data, set project_id to the first available project (or leave NULL if no projects exist)
DO $$
DECLARE
    first_project_id TEXT;
BEGIN
    SELECT id INTO first_project_id FROM projects LIMIT 1;
    
    IF first_project_id IS NOT NULL THEN
        UPDATE "excavator_entries" SET "project_id" = first_project_id WHERE "project_id" IS NULL;
        UPDATE "hauling_entries" SET "project_id" = first_project_id WHERE "project_id" IS NULL;
        UPDATE "crusher_feed_entries" SET "project_id" = first_project_id WHERE "project_id" IS NULL;
        UPDATE "crusher_output_entries" SET "project_id" = first_project_id WHERE "project_id" IS NULL;
        UPDATE "stock_levels" SET "project_id" = first_project_id WHERE "project_id" IS NULL;
    END IF;
END $$;

-- Now make project_id NOT NULL (only if we populated them, otherwise leave nullable for now)
-- The application will require project_id for new entries going forward
DO $$
DECLARE
    has_data BOOLEAN;
BEGIN
    -- Check if we have any entries that need project_id
    SELECT EXISTS(SELECT 1 FROM "excavator_entries" WHERE "project_id" IS NULL) INTO has_data;
    
    IF NOT has_data THEN
        -- Only set NOT NULL if all rows have project_id populated
        ALTER TABLE "excavator_entries" ALTER COLUMN "project_id" SET NOT NULL;
        ALTER TABLE "hauling_entries" ALTER COLUMN "project_id" SET NOT NULL;
        ALTER TABLE "crusher_feed_entries" ALTER COLUMN "project_id" SET NOT NULL;
        ALTER TABLE "crusher_output_entries" ALTER COLUMN "project_id" SET NOT NULL;
        ALTER TABLE "stock_levels" ALTER COLUMN "project_id" SET NOT NULL;
    END IF;
END $$;

-- Add assetId to equipment tables (with unique constraint)
ALTER TABLE "excavators" ADD COLUMN IF NOT EXISTS "asset_id" TEXT;
ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "asset_id" TEXT;
ALTER TABLE "crushers" ADD COLUMN IF NOT EXISTS "asset_id" TEXT;

-- Add stockItemId to stock_levels
ALTER TABLE "stock_levels" ADD COLUMN IF NOT EXISTS "stock_item_id" TEXT;

-- Create QuarrySettings table
CREATE TABLE IF NOT EXISTS "quarry_settings" (
    "id" TEXT NOT NULL,
    "default_company_id" TEXT,
    "default_project_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quarry_settings_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
DO $$ 
BEGIN
    -- Add project foreign keys
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'excavator_entries_project_id_fkey') THEN
        ALTER TABLE "excavator_entries" ADD CONSTRAINT "excavator_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hauling_entries_project_id_fkey') THEN
        ALTER TABLE "hauling_entries" ADD CONSTRAINT "hauling_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crusher_feed_entries_project_id_fkey') THEN
        ALTER TABLE "crusher_feed_entries" ADD CONSTRAINT "crusher_feed_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crusher_output_entries_project_id_fkey') THEN
        ALTER TABLE "crusher_output_entries" ADD CONSTRAINT "crusher_output_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_levels_project_id_fkey') THEN
        ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    -- Add asset foreign keys
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'excavators_asset_id_fkey') THEN
        ALTER TABLE "excavators" ADD CONSTRAINT "excavators_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trucks_asset_id_fkey') THEN
        ALTER TABLE "trucks" ADD CONSTRAINT "trucks_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crushers_asset_id_fkey') THEN
        ALTER TABLE "crushers" ADD CONSTRAINT "crushers_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    -- Add stock item foreign key
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_levels_stock_item_id_fkey') THEN
        ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_stock_item_id_fkey" FOREIGN KEY ("stock_item_id") REFERENCES "stock_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    -- Add QuarrySettings foreign keys
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quarry_settings_default_company_id_fkey') THEN
        ALTER TABLE "quarry_settings" ADD CONSTRAINT "quarry_settings_default_company_id_fkey" FOREIGN KEY ("default_company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quarry_settings_default_project_id_fkey') THEN
        ALTER TABLE "quarry_settings" ADD CONSTRAINT "quarry_settings_default_project_id_fkey" FOREIGN KEY ("default_project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Add unique constraints
DO $$
BEGIN
    -- Unique constraint on assetId for equipment
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'excavators_asset_id_key') THEN
        ALTER TABLE "excavators" ADD CONSTRAINT "excavators_asset_id_key" UNIQUE ("asset_id");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trucks_asset_id_key') THEN
        ALTER TABLE "trucks" ADD CONSTRAINT "trucks_asset_id_key" UNIQUE ("asset_id");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crushers_asset_id_key') THEN
        ALTER TABLE "crushers" ADD CONSTRAINT "crushers_asset_id_key" UNIQUE ("asset_id");
    END IF;
    
    -- Unique constraint on defaultCompanyId and defaultProjectId
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quarry_settings_default_company_id_key') THEN
        ALTER TABLE "quarry_settings" ADD CONSTRAINT "quarry_settings_default_company_id_key" UNIQUE ("default_company_id");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quarry_settings_default_project_id_key') THEN
        ALTER TABLE "quarry_settings" ADD CONSTRAINT "quarry_settings_default_project_id_key" UNIQUE ("default_project_id");
    END IF;
END $$;

-- Update unique constraints to include projectId
DO $$
BEGIN
    -- Drop old unique constraints if they exist
    DROP INDEX IF EXISTS "excavator_entries_date_shift_excavatorId_operatorId_key";
    DROP INDEX IF EXISTS "hauling_entries_date_shift_truckId_driverId_key";
    DROP INDEX IF EXISTS "crusher_feed_entries_date_shift_crusherId_key";
    DROP INDEX IF EXISTS "crusher_output_entries_date_shift_crusherId_productTypeId_stockpileLocationId_key";
    DROP INDEX IF EXISTS "stock_levels_date_productTypeId_stockpileLocationId_key";
    
    -- Create new unique constraints with projectId
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'excavator_entries_date_shift_projectId_excavatorId_operatorId_key') THEN
        CREATE UNIQUE INDEX "excavator_entries_date_shift_projectId_excavatorId_operatorId_key" ON "excavator_entries"("date", "shift", "project_id", "excavator_id", "operator_id");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hauling_entries_date_shift_projectId_truckId_driverId_key') THEN
        CREATE UNIQUE INDEX "hauling_entries_date_shift_projectId_truckId_driverId_key" ON "hauling_entries"("date", "shift", "project_id", "truck_id", "driver_id");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crusher_feed_entries_date_shift_projectId_crusherId_key') THEN
        CREATE UNIQUE INDEX "crusher_feed_entries_date_shift_projectId_crusherId_key" ON "crusher_feed_entries"("date", "shift", "project_id", "crusher_id");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crusher_output_entries_date_shift_projectId_crusherId_productTypeId_stockpileLocationId_key') THEN
        CREATE UNIQUE INDEX "crusher_output_entries_date_shift_projectId_crusherId_productTypeId_stockpileLocationId_key" ON "crusher_output_entries"("date", "shift", "project_id", "crusher_id", "product_type_id", "stockpile_location_id");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_levels_date_projectId_productTypeId_stockpileLocationId_key') THEN
        CREATE UNIQUE INDEX "stock_levels_date_projectId_productTypeId_stockpileLocationId_key" ON "stock_levels"("date", "project_id", "product_type_id", "stockpile_location_id");
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "excavator_entries_project_id_idx" ON "excavator_entries"("project_id");
CREATE INDEX IF NOT EXISTS "hauling_entries_project_id_idx" ON "hauling_entries"("project_id");
CREATE INDEX IF NOT EXISTS "crusher_feed_entries_project_id_idx" ON "crusher_feed_entries"("project_id");
CREATE INDEX IF NOT EXISTS "crusher_output_entries_project_id_idx" ON "crusher_output_entries"("project_id");
CREATE INDEX IF NOT EXISTS "stock_levels_project_id_idx" ON "stock_levels"("project_id");
CREATE INDEX IF NOT EXISTS "stock_levels_stock_item_id_idx" ON "stock_levels"("stock_item_id");

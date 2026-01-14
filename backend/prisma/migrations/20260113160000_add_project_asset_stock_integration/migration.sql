-- Add projectId to all quarry production entries (nullable first)
ALTER TABLE "excavator_entries" ADD COLUMN IF NOT EXISTS "project_id" TEXT;
ALTER TABLE "hauling_entries" ADD COLUMN IF NOT EXISTS "project_id" TEXT;
ALTER TABLE "crusher_feed_entries" ADD COLUMN IF NOT EXISTS "project_id" TEXT;
ALTER TABLE "crusher_output_entries" ADD COLUMN IF NOT EXISTS "project_id" TEXT;
ALTER TABLE "stock_levels" ADD COLUMN IF NOT EXISTS "project_id" TEXT;

-- Populate project_id with first available project if any exist
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

-- Make project_id NOT NULL only if all rows have values (or table is empty)
DO $$
DECLARE
    has_null_values BOOLEAN;
BEGIN
    -- Check if any table has NULL project_id values
    SELECT EXISTS(
        SELECT 1 FROM "excavator_entries" WHERE "project_id" IS NULL
        UNION ALL
        SELECT 1 FROM "hauling_entries" WHERE "project_id" IS NULL
        UNION ALL
        SELECT 1 FROM "crusher_feed_entries" WHERE "project_id" IS NULL
        UNION ALL
        SELECT 1 FROM "crusher_output_entries" WHERE "project_id" IS NULL
        UNION ALL
        SELECT 1 FROM "stock_levels" WHERE "project_id" IS NULL
    ) INTO has_null_values;
    
    -- Only set NOT NULL if no NULL values exist
    IF NOT has_null_values THEN
        ALTER TABLE "excavator_entries" ALTER COLUMN "project_id" SET NOT NULL;
        ALTER TABLE "hauling_entries" ALTER COLUMN "project_id" SET NOT NULL;
        ALTER TABLE "crusher_feed_entries" ALTER COLUMN "project_id" SET NOT NULL;
        ALTER TABLE "crusher_output_entries" ALTER COLUMN "project_id" SET NOT NULL;
        ALTER TABLE "stock_levels" ALTER COLUMN "project_id" SET NOT NULL;
    END IF;
END $$;

-- Add assetId to equipment tables
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

-- Add foreign key constraints (only if project_id columns are NOT NULL)
DO $$ 
BEGIN
    -- Check if project_id columns are NOT NULL before adding FKs
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'excavator_entries' 
        AND column_name = 'project_id' 
        AND is_nullable = 'NO'
    ) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'excavator_entries_project_id_fkey') THEN
            ALTER TABLE "excavator_entries" ADD CONSTRAINT "excavator_entries_project_id_fkey" 
                FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hauling_entries' 
        AND column_name = 'project_id' 
        AND is_nullable = 'NO'
    ) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hauling_entries_project_id_fkey') THEN
            ALTER TABLE "hauling_entries" ADD CONSTRAINT "hauling_entries_project_id_fkey" 
                FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crusher_feed_entries' 
        AND column_name = 'project_id' 
        AND is_nullable = 'NO'
    ) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crusher_feed_entries_project_id_fkey') THEN
            ALTER TABLE "crusher_feed_entries" ADD CONSTRAINT "crusher_feed_entries_project_id_fkey" 
                FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crusher_output_entries' 
        AND column_name = 'project_id' 
        AND is_nullable = 'NO'
    ) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crusher_output_entries_project_id_fkey') THEN
            ALTER TABLE "crusher_output_entries" ADD CONSTRAINT "crusher_output_entries_project_id_fkey" 
                FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_levels' 
        AND column_name = 'project_id' 
        AND is_nullable = 'NO'
    ) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_levels_project_id_fkey') THEN
            ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_project_id_fkey" 
                FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
    END IF;
    
    -- Add asset foreign keys (nullable, so always safe)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'excavators_asset_id_fkey') THEN
        ALTER TABLE "excavators" ADD CONSTRAINT "excavators_asset_id_fkey" 
            FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trucks_asset_id_fkey') THEN
        ALTER TABLE "trucks" ADD CONSTRAINT "trucks_asset_id_fkey" 
            FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crushers_asset_id_fkey') THEN
        ALTER TABLE "crushers" ADD CONSTRAINT "crushers_asset_id_fkey" 
            FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    -- Add stock item foreign key (nullable, so always safe)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_levels_stock_item_id_fkey') THEN
        ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_stock_item_id_fkey" 
            FOREIGN KEY ("stock_item_id") REFERENCES "stock_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    -- Add QuarrySettings foreign keys (nullable, so always safe)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quarry_settings_default_company_id_fkey') THEN
        ALTER TABLE "quarry_settings" ADD CONSTRAINT "quarry_settings_default_company_id_fkey" 
            FOREIGN KEY ("default_company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quarry_settings_default_project_id_fkey') THEN
        ALTER TABLE "quarry_settings" ADD CONSTRAINT "quarry_settings_default_project_id_fkey" 
            FOREIGN KEY ("default_project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Add unique constraints
DO $$
BEGIN
    -- Unique constraint on assetId for equipment (only if not null)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'excavators_asset_id_key') THEN
        CREATE UNIQUE INDEX IF NOT EXISTS "excavators_asset_id_key" ON "excavators"("asset_id") WHERE "asset_id" IS NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trucks_asset_id_key') THEN
        CREATE UNIQUE INDEX IF NOT EXISTS "trucks_asset_id_key" ON "trucks"("asset_id") WHERE "asset_id" IS NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crushers_asset_id_key') THEN
        CREATE UNIQUE INDEX IF NOT EXISTS "crushers_asset_id_key" ON "crushers"("asset_id") WHERE "asset_id" IS NOT NULL;
    END IF;
    
    -- Unique constraint on defaultCompanyId and defaultProjectId (only if not null)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quarry_settings_default_company_id_key') THEN
        CREATE UNIQUE INDEX IF NOT EXISTS "quarry_settings_default_company_id_key" ON "quarry_settings"("default_company_id") WHERE "default_company_id" IS NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quarry_settings_default_project_id_key') THEN
        CREATE UNIQUE INDEX IF NOT EXISTS "quarry_settings_default_project_id_key" ON "quarry_settings"("default_project_id") WHERE "default_project_id" IS NOT NULL;
    END IF;
END $$;

-- Drop old unique constraints if they exist
DROP INDEX IF EXISTS "excavator_entries_date_shift_excavatorId_operatorId_key";
DROP INDEX IF EXISTS "excavator_entries_date_shift_excavator_id_operator_id_key";
DROP INDEX IF EXISTS "hauling_entries_date_shift_truckId_driverId_key";
DROP INDEX IF EXISTS "hauling_entries_date_shift_truck_id_driver_id_key";
DROP INDEX IF EXISTS "crusher_feed_entries_date_shift_crusherId_key";
DROP INDEX IF EXISTS "crusher_feed_entries_date_shift_crusher_id_key";
DROP INDEX IF EXISTS "crusher_output_entries_date_shift_crusherId_productTypeId_stockpileLocationId_key";
DROP INDEX IF EXISTS "stock_levels_date_productTypeId_stockpileLocationId_key";
DROP INDEX IF EXISTS "stock_levels_date_product_type_id_stockpile_location_id_key";

-- Create new unique constraints with projectId (only if project_id is NOT NULL)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'excavator_entries' 
        AND column_name = 'project_id' 
        AND is_nullable = 'NO'
    ) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexname = 'excavator_entries_date_shift_projectId_excavatorId_operatorId_key') THEN
            CREATE UNIQUE INDEX "excavator_entries_date_shift_projectId_excavatorId_operatorId_key" 
                ON "excavator_entries"("date", "shift", "project_id", "excavator_id", "operator_id");
        END IF;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hauling_entries' 
        AND column_name = 'project_id' 
        AND is_nullable = 'NO'
    ) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexname = 'hauling_entries_date_shift_projectId_truckId_driverId_key') THEN
            CREATE UNIQUE INDEX "hauling_entries_date_shift_projectId_truckId_driverId_key" 
                ON "hauling_entries"("date", "shift", "project_id", "truck_id", "driver_id");
        END IF;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crusher_feed_entries' 
        AND column_name = 'project_id' 
        AND is_nullable = 'NO'
    ) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexname = 'crusher_feed_entries_date_shift_projectId_crusherId_key') THEN
            CREATE UNIQUE INDEX "crusher_feed_entries_date_shift_projectId_crusherId_key" 
                ON "crusher_feed_entries"("date", "shift", "project_id", "crusher_id");
        END IF;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crusher_output_entries' 
        AND column_name = 'project_id' 
        AND is_nullable = 'NO'
    ) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexname = 'crusher_output_entries_date_shift_projectId_crusherId_productTypeId_stockpileLocationId_key') THEN
            CREATE UNIQUE INDEX "crusher_output_entries_date_shift_projectId_crusherId_productTypeId_stockpileLocationId_key" 
                ON "crusher_output_entries"("date", "shift", "project_id", "crusher_id", "product_type_id", "stockpile_location_id");
        END IF;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_levels' 
        AND column_name = 'project_id' 
        AND is_nullable = 'NO'
    ) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexname = 'stock_levels_date_projectId_productTypeId_stockpileLocationId_key') THEN
            CREATE UNIQUE INDEX "stock_levels_date_projectId_productTypeId_stockpileLocationId_key" 
                ON "stock_levels"("date", "project_id", "product_type_id", "stockpile_location_id");
        END IF;
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "excavator_entries_project_id_idx" ON "excavator_entries"("project_id");
CREATE INDEX IF NOT EXISTS "hauling_entries_project_id_idx" ON "hauling_entries"("project_id");
CREATE INDEX IF NOT EXISTS "crusher_feed_entries_project_id_idx" ON "crusher_feed_entries"("project_id");
CREATE INDEX IF NOT EXISTS "crusher_output_entries_project_id_idx" ON "crusher_output_entries"("project_id");
CREATE INDEX IF NOT EXISTS "stock_levels_project_id_idx" ON "stock_levels"("project_id");
CREATE INDEX IF NOT EXISTS "stock_levels_stock_item_id_idx" ON "stock_levels"("stock_item_id");

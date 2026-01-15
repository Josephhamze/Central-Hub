-- CreateEnum
CREATE TYPE "IndexType" AS ENUM ('HOURS', 'KILOMETERS', 'MILES', 'CYCLES', 'UNITS', 'OTHER');
CREATE TYPE "AssetLifecycleStatus" AS ENUM ('NEW', 'IN_SERVICE', 'UNDER_MAINTENANCE', 'IDLE', 'RETIRED', 'DISPOSED');

-- Rename name column to asset_name
ALTER TABLE "assets" RENAME COLUMN "name" TO "asset_name";

-- Make acquisition_date, acquisition_cost, and current_value nullable (legacy fields)
ALTER TABLE "assets" ALTER COLUMN "acquisition_date" DROP NOT NULL;
ALTER TABLE "assets" ALTER COLUMN "acquisition_cost" DROP NOT NULL;
ALTER TABLE "assets" ALTER COLUMN "current_value" DROP NOT NULL;

-- ASSET IDENTITY - Add new fields
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "type" TEXT;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "family" TEXT;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "year_model" INTEGER;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "color" TEXT;

-- ALLOCATION - Add new fields
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "company_id" TEXT;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "company_code" TEXT;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "country_of_registration" TEXT;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "current_location" TEXT;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "parent_asset_id" TEXT;

-- IDENTIFICATION - Add new fields
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "chassis_number" TEXT;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "engine_number" TEXT;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "registration_number" TEXT;

-- FINANCIAL INFORMATION - Add new fields
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "purchase_date" TIMESTAMP(3);
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "purchase_value" DECIMAL(12, 2);
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'USD';
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "brand_new_value" DECIMAL(12, 2);
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "current_market_value" DECIMAL(12, 2);
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "residual_value" DECIMAL(12, 2);
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "purchase_order" TEXT;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "gl_account" TEXT;

-- LIFECYCLE - Add new fields
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "install_date" TIMESTAMP(3);
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "end_of_life_date" TIMESTAMP(3);
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "disposal_date" TIMESTAMP(3);
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "asset_lifecycle_status" "AssetLifecycleStatus";

-- INDEX DETAILS - Add new fields
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "index_type" "IndexType";
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "current_index" DECIMAL(12, 2);
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "index_at_purchase" DECIMAL(12, 2);
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "last_index_date" TIMESTAMP(3);

-- STATUS - Add new fields
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "status_since" TIMESTAMP(3);
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "availability_percent" DECIMAL(5, 2);
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "last_operator" TEXT;

-- MAINTENANCE - Add new fields
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "last_maintenance_date" TIMESTAMP(3);
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "next_maintenance_date" TIMESTAMP(3);
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "maintenance_budget" DECIMAL(12, 2);

-- Add foreign key constraints
DO $$
BEGIN
    -- Add company foreign key
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assets_company_id_fkey') THEN
        ALTER TABLE "assets" ADD CONSTRAINT "assets_company_id_fkey" 
            FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    -- Add parent asset foreign key (self-referencing)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assets_parent_asset_id_fkey') THEN
        ALTER TABLE "assets" ADD CONSTRAINT "assets_parent_asset_id_fkey" 
            FOREIGN KEY ("parent_asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS "assets_company_id_idx" ON "assets"("company_id");
CREATE INDEX IF NOT EXISTS "assets_parent_asset_id_idx" ON "assets"("parent_asset_id");

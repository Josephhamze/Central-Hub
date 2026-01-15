-- CreateEnum
CREATE TYPE "IndexType" AS ENUM ('HOURS', 'KILOMETERS', 'MILES', 'CYCLES', 'UNITS', 'OTHER');
CREATE TYPE "AssetLifecycleStatus" AS ENUM ('NEW', 'IN_SERVICE', 'UNDER_MAINTENANCE', 'IDLE', 'RETIRED', 'DISPOSED');

-- Rename name column to asset_name (only if it exists and is named 'name')
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'name'
    ) THEN
        ALTER TABLE "assets" RENAME COLUMN "name" TO "asset_name";
    END IF;
END $$;

-- Rename asset_code to asset_tag if needed (check if asset_code exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'asset_code'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'asset_tag'
    ) THEN
        ALTER TABLE "assets" RENAME COLUMN "asset_code" TO "asset_tag";
    END IF;
END $$;

-- Rename purchase_date to acquisition_date if needed (for backward compatibility)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'purchase_date'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'acquisition_date'
    ) THEN
        ALTER TABLE "assets" RENAME COLUMN "purchase_date" TO "acquisition_date";
    END IF;
END $$;

-- Rename purchase_price to acquisition_cost if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'purchase_price'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'acquisition_cost'
    ) THEN
        ALTER TABLE "assets" RENAME COLUMN "purchase_price" TO "acquisition_cost";
    END IF;
END $$;

-- Make acquisition_date, acquisition_cost, and current_value nullable (if they exist)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'acquisition_date' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "assets" ALTER COLUMN "acquisition_date" DROP NOT NULL;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'acquisition_cost' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "assets" ALTER COLUMN "acquisition_cost" DROP NOT NULL;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'current_value' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "assets" ALTER COLUMN "current_value" DROP NOT NULL;
    END IF;
END $$;

-- ASSET IDENTITY - Add new fields
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "type" TEXT;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "family" TEXT;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "year_model" INTEGER;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "color" TEXT;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "manufacturer" TEXT;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "model" TEXT;

-- ALLOCATION - Add new fields
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "company_id" TEXT;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "project_id" TEXT;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "company_code" TEXT;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "country_of_registration" TEXT;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "current_location" TEXT;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "parent_asset_id" TEXT;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "warehouse_id" TEXT;

-- IDENTIFICATION - Add new fields
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "serial_number" TEXT;
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
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "assigned_to" TEXT;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "criticality" TEXT DEFAULT 'MEDIUM';
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "expected_life_years" INTEGER;

-- MAINTENANCE - Add new fields
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "last_maintenance_date" TIMESTAMP(3);
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "next_maintenance_date" TIMESTAMP(3);
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "maintenance_budget" DECIMAL(12, 2);

-- Add foreign key constraints
DO $$
BEGIN
    -- Add company foreign key (only if companies table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assets_company_id_fkey') THEN
            ALTER TABLE "assets" ADD CONSTRAINT "assets_company_id_fkey" 
                FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
    
    -- Add parent asset foreign key (self-referencing)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assets_parent_asset_id_fkey') THEN
        ALTER TABLE "assets" ADD CONSTRAINT "assets_parent_asset_id_fkey" 
            FOREIGN KEY ("parent_asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    -- Add project foreign key (only if projects table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assets_project_id_fkey') THEN
            ALTER TABLE "assets" ADD CONSTRAINT "assets_project_id_fkey" 
                FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS "assets_company_id_idx" ON "assets"("company_id");
CREATE INDEX IF NOT EXISTS "assets_parent_asset_id_idx" ON "assets"("parent_asset_id");
CREATE INDEX IF NOT EXISTS "assets_project_id_idx" ON "assets"("project_id");
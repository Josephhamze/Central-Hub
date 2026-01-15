-- Migration: Create Assets and Maintenance Tables
-- This migration creates the complete assets and maintenance system that was missing

-- ============================================================================
-- STEP 1: Create Enums (with proper case handling)
-- ============================================================================

-- Drop old enum types if they exist with wrong case (snake_case)
DO $$
BEGIN
    -- Handle asset_status -> AssetStatus migration
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_status') THEN
        -- Check if assets table exists and has status column using old enum
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'assets' AND column_name = 'status'
        ) THEN
            -- Create temp column, migrate data, drop old, rename new
            ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "status_new" TEXT;
            UPDATE "assets" SET "status_new" = "status"::TEXT WHERE "status_new" IS NULL;
            ALTER TABLE "assets" DROP COLUMN IF EXISTS "status";
        END IF;
        DROP TYPE IF EXISTS "asset_status" CASCADE;
    END IF;
END $$;

-- Create AssetStatus enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AssetStatus') THEN
        CREATE TYPE "AssetStatus" AS ENUM ('OPERATIONAL', 'MAINTENANCE', 'BROKEN', 'RETIRED');
    END IF;
END $$;

-- Create AssetCriticality enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AssetCriticality') THEN
        CREATE TYPE "AssetCriticality" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
    END IF;
END $$;

-- Create MaintenanceScheduleType enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MaintenanceScheduleType') THEN
        CREATE TYPE "MaintenanceScheduleType" AS ENUM ('TIME_BASED', 'USAGE_BASED');
    END IF;
END $$;

-- Create WorkOrderType enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkOrderType') THEN
        CREATE TYPE "WorkOrderType" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'INSPECTION');
    END IF;
END $$;

-- Create WorkOrderPriority enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkOrderPriority') THEN
        CREATE TYPE "WorkOrderPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
    END IF;
END $$;

-- Create WorkOrderStatus enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkOrderStatus') THEN
        CREATE TYPE "WorkOrderStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'CANCELLED');
    END IF;
END $$;

-- Create DepreciationMethod enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DepreciationMethod') THEN
        CREATE TYPE "DepreciationMethod" AS ENUM ('STRAIGHT_LINE', 'DECLINING_BALANCE');
    END IF;
END $$;

-- Create AssetHistoryEventType enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AssetHistoryEventType') THEN
        CREATE TYPE "AssetHistoryEventType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'MAINTENANCE_DONE', 'WORK_ORDER_COMPLETED', 'PART_CONSUMED', 'COST_UPDATED', 'RETIRED');
    END IF;
END $$;

-- Create IndexType enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IndexType') THEN
        CREATE TYPE "IndexType" AS ENUM ('HOURS', 'KILOMETERS', 'MILES', 'CYCLES', 'UNITS', 'OTHER');
    END IF;
END $$;

-- Create AssetLifecycleStatus enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AssetLifecycleStatus') THEN
        CREATE TYPE "AssetLifecycleStatus" AS ENUM ('NEW', 'IN_SERVICE', 'UNDER_MAINTENANCE', 'IDLE', 'RETIRED', 'DISPOSED');
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Create Assets Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS "assets" (
    "id" TEXT NOT NULL,
    "asset_tag" TEXT NOT NULL,

    -- ASSET IDENTITY
    "asset_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT,
    "family" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "year_model" INTEGER,
    "color" TEXT,

    -- ALLOCATION
    "company_id" TEXT,
    "project_id" TEXT,
    "company_code" TEXT,
    "country_of_registration" TEXT,
    "current_location" TEXT,
    "parent_asset_id" TEXT,

    -- IDENTIFICATION
    "serial_number" TEXT,
    "chassis_number" TEXT,
    "engine_number" TEXT,
    "registration_number" TEXT,

    -- FINANCIAL INFORMATION
    "purchase_date" TIMESTAMP(3),
    "purchase_value" DECIMAL(12, 2),
    "currency" TEXT DEFAULT 'USD',
    "brand_new_value" DECIMAL(12, 2),
    "current_market_value" DECIMAL(12, 2),
    "residual_value" DECIMAL(12, 2),
    "purchase_order" TEXT,
    "gl_account" TEXT,

    -- LIFECYCLE
    "install_date" TIMESTAMP(3),
    "end_of_life_date" TIMESTAMP(3),
    "disposal_date" TIMESTAMP(3),
    "asset_lifecycle_status" "AssetLifecycleStatus",

    -- INDEX DETAILS
    "index_type" "IndexType",
    "current_index" DECIMAL(12, 2),
    "index_at_purchase" DECIMAL(12, 2),
    "last_index_date" TIMESTAMP(3),

    -- STATUS
    "status" "AssetStatus" NOT NULL DEFAULT 'OPERATIONAL',
    "status_since" TIMESTAMP(3),
    "availability_percent" DECIMAL(5, 2),
    "last_operator" TEXT,

    -- MAINTENANCE
    "last_maintenance_date" TIMESTAMP(3),
    "next_maintenance_date" TIMESTAMP(3),
    "maintenance_budget" DECIMAL(12, 2),

    -- LEGACY FIELDS
    "acquisition_date" TIMESTAMP(3),
    "acquisition_cost" DECIMAL(12, 2),
    "current_value" DECIMAL(12, 2),
    "location" TEXT,
    "warehouse_id" TEXT,
    "assigned_to" TEXT,
    "criticality" "AssetCriticality" NOT NULL DEFAULT 'MEDIUM',
    "expected_life_years" INTEGER,
    "notes" TEXT,

    -- TIMESTAMPS
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- Create unique index for asset_tag
CREATE UNIQUE INDEX IF NOT EXISTS "assets_asset_tag_key" ON "assets"("asset_tag");

-- Create indexes for assets
CREATE INDEX IF NOT EXISTS "assets_asset_tag_idx" ON "assets"("asset_tag");
CREATE INDEX IF NOT EXISTS "assets_status_idx" ON "assets"("status");
CREATE INDEX IF NOT EXISTS "assets_category_idx" ON "assets"("category");
CREATE INDEX IF NOT EXISTS "assets_project_id_idx" ON "assets"("project_id");
CREATE INDEX IF NOT EXISTS "assets_company_id_idx" ON "assets"("company_id");
CREATE INDEX IF NOT EXISTS "assets_warehouse_id_idx" ON "assets"("warehouse_id");
CREATE INDEX IF NOT EXISTS "assets_parent_asset_id_idx" ON "assets"("parent_asset_id");

-- ============================================================================
-- STEP 3: Create Maintenance Schedules Table (WITH type column!)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "maintenance_schedules" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "type" "MaintenanceScheduleType" NOT NULL,
    "interval_days" INTEGER,
    "interval_hours" INTEGER,
    "checklist_json" JSONB,
    "estimated_duration_hours" DECIMAL(5, 2),
    "required_parts_json" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_performed_at" TIMESTAMP(3),
    "next_due_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_schedules_pkey" PRIMARY KEY ("id")
);

-- Create indexes for maintenance_schedules
CREATE INDEX IF NOT EXISTS "maintenance_schedules_asset_id_idx" ON "maintenance_schedules"("asset_id");
CREATE INDEX IF NOT EXISTS "maintenance_schedules_is_active_idx" ON "maintenance_schedules"("is_active");
CREATE INDEX IF NOT EXISTS "maintenance_schedules_next_due_at_idx" ON "maintenance_schedules"("next_due_at");

-- ============================================================================
-- STEP 4: Create Work Orders Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS "work_orders" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "schedule_id" TEXT,
    "type" "WorkOrderType" NOT NULL,
    "priority" "WorkOrderPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "assigned_to_user_id" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "downtime_hours" DECIMAL(10, 2),
    "labor_cost" DECIMAL(12, 2) NOT NULL DEFAULT 0,
    "parts_cost" DECIMAL(12, 2) NOT NULL DEFAULT 0,
    "total_cost" DECIMAL(12, 2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- Create indexes for work_orders
CREATE INDEX IF NOT EXISTS "work_orders_asset_id_idx" ON "work_orders"("asset_id");
CREATE INDEX IF NOT EXISTS "work_orders_schedule_id_idx" ON "work_orders"("schedule_id");
CREATE INDEX IF NOT EXISTS "work_orders_status_idx" ON "work_orders"("status");
CREATE INDEX IF NOT EXISTS "work_orders_assigned_to_user_id_idx" ON "work_orders"("assigned_to_user_id");
CREATE INDEX IF NOT EXISTS "work_orders_created_at_idx" ON "work_orders"("created_at");

-- ============================================================================
-- STEP 5: Create Spare Parts Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS "spare_parts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "uom" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "quantity_on_hand" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "min_stock_level" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "unit_cost" DECIMAL(10, 2) NOT NULL,
    "is_critical" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spare_parts_pkey" PRIMARY KEY ("id")
);

-- Create unique index for sku
CREATE UNIQUE INDEX IF NOT EXISTS "spare_parts_sku_key" ON "spare_parts"("sku");

-- Create indexes for spare_parts
CREATE INDEX IF NOT EXISTS "spare_parts_sku_idx" ON "spare_parts"("sku");
CREATE INDEX IF NOT EXISTS "spare_parts_warehouse_id_idx" ON "spare_parts"("warehouse_id");

-- ============================================================================
-- STEP 6: Create Part Usages Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS "part_usages" (
    "id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "spare_part_id" TEXT NOT NULL,
    "quantity_used" DECIMAL(10, 2) NOT NULL,
    "cost_snapshot" DECIMAL(10, 2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "part_usages_pkey" PRIMARY KEY ("id")
);

-- Create indexes for part_usages
CREATE INDEX IF NOT EXISTS "part_usages_work_order_id_idx" ON "part_usages"("work_order_id");
CREATE INDEX IF NOT EXISTS "part_usages_spare_part_id_idx" ON "part_usages"("spare_part_id");

-- ============================================================================
-- STEP 7: Create Asset History Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS "asset_history" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "event_type" "AssetHistoryEventType" NOT NULL,
    "metadata_json" JSONB,
    "actor_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_history_pkey" PRIMARY KEY ("id")
);

-- Create indexes for asset_history
CREATE INDEX IF NOT EXISTS "asset_history_asset_id_idx" ON "asset_history"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_history_event_type_idx" ON "asset_history"("event_type");
CREATE INDEX IF NOT EXISTS "asset_history_created_at_idx" ON "asset_history"("created_at");

-- ============================================================================
-- STEP 8: Create Depreciation Profile Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS "depreciation_profiles" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "method" "DepreciationMethod" NOT NULL,
    "useful_life_years" INTEGER NOT NULL,
    "salvage_value" DECIMAL(12, 2) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "depreciation_profiles_pkey" PRIMARY KEY ("id")
);

-- Create unique index for asset_id
CREATE UNIQUE INDEX IF NOT EXISTS "depreciation_profiles_asset_id_key" ON "depreciation_profiles"("asset_id");

-- Create indexes for depreciation_profiles
CREATE INDEX IF NOT EXISTS "depreciation_profiles_asset_id_idx" ON "depreciation_profiles"("asset_id");

-- ============================================================================
-- STEP 9: Create Depreciation Entries Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS "depreciation_entries" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "depreciation_amount" DECIMAL(12, 2) NOT NULL,
    "book_value_after" DECIMAL(12, 2) NOT NULL,
    "is_posted" BOOLEAN NOT NULL DEFAULT false,
    "posted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "depreciation_entries_pkey" PRIMARY KEY ("id")
);

-- Create unique index for asset_id + period
CREATE UNIQUE INDEX IF NOT EXISTS "depreciation_entries_asset_id_period_key" ON "depreciation_entries"("asset_id", "period");

-- Create indexes for depreciation_entries
CREATE INDEX IF NOT EXISTS "depreciation_entries_asset_id_idx" ON "depreciation_entries"("asset_id");
CREATE INDEX IF NOT EXISTS "depreciation_entries_profile_id_idx" ON "depreciation_entries"("profile_id");
CREATE INDEX IF NOT EXISTS "depreciation_entries_period_idx" ON "depreciation_entries"("period");
CREATE INDEX IF NOT EXISTS "depreciation_entries_is_posted_idx" ON "depreciation_entries"("is_posted");

-- ============================================================================
-- STEP 10: Add Foreign Key Constraints
-- ============================================================================

-- Assets foreign keys
DO $$
BEGIN
    -- Company FK
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assets_company_id_fkey') THEN
            ALTER TABLE "assets" ADD CONSTRAINT "assets_company_id_fkey"
                FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;

    -- Project FK
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assets_project_id_fkey') THEN
            ALTER TABLE "assets" ADD CONSTRAINT "assets_project_id_fkey"
                FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;

    -- Warehouse FK
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'warehouses') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assets_warehouse_id_fkey') THEN
            ALTER TABLE "assets" ADD CONSTRAINT "assets_warehouse_id_fkey"
                FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;

    -- Parent Asset FK (self-referencing)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assets_parent_asset_id_fkey') THEN
        ALTER TABLE "assets" ADD CONSTRAINT "assets_parent_asset_id_fkey"
            FOREIGN KEY ("parent_asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Maintenance Schedules FK
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'maintenance_schedules_asset_id_fkey') THEN
        ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_asset_id_fkey"
            FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Work Orders FKs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'work_orders_asset_id_fkey') THEN
        ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_asset_id_fkey"
            FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'work_orders_schedule_id_fkey') THEN
        ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_schedule_id_fkey"
            FOREIGN KEY ("schedule_id") REFERENCES "maintenance_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'work_orders_assigned_to_user_id_fkey') THEN
            ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_assigned_to_user_id_fkey"
                FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- Spare Parts FK
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'warehouses') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'spare_parts_warehouse_id_fkey') THEN
            ALTER TABLE "spare_parts" ADD CONSTRAINT "spare_parts_warehouse_id_fkey"
                FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- Part Usages FKs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'part_usages_work_order_id_fkey') THEN
        ALTER TABLE "part_usages" ADD CONSTRAINT "part_usages_work_order_id_fkey"
            FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'part_usages_spare_part_id_fkey') THEN
        ALTER TABLE "part_usages" ADD CONSTRAINT "part_usages_spare_part_id_fkey"
            FOREIGN KEY ("spare_part_id") REFERENCES "spare_parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Asset History FKs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'asset_history_asset_id_fkey') THEN
        ALTER TABLE "asset_history" ADD CONSTRAINT "asset_history_asset_id_fkey"
            FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'asset_history_actor_user_id_fkey') THEN
            ALTER TABLE "asset_history" ADD CONSTRAINT "asset_history_actor_user_id_fkey"
                FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- Depreciation Profile FK
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'depreciation_profiles_asset_id_fkey') THEN
        ALTER TABLE "depreciation_profiles" ADD CONSTRAINT "depreciation_profiles_asset_id_fkey"
            FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Depreciation Entries FKs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'depreciation_entries_asset_id_fkey') THEN
        ALTER TABLE "depreciation_entries" ADD CONSTRAINT "depreciation_entries_asset_id_fkey"
            FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'depreciation_entries_profile_id_fkey') THEN
        ALTER TABLE "depreciation_entries" ADD CONSTRAINT "depreciation_entries_profile_id_fkey"
            FOREIGN KEY ("profile_id") REFERENCES "depreciation_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- STEP 11: Add Equipment Asset Links (for Quarry Production)
-- ============================================================================

-- Update excavators with asset link
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'excavators') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'excavators_asset_id_fkey') THEN
            ALTER TABLE "excavators" ADD CONSTRAINT "excavators_asset_id_fkey"
                FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- Update trucks with asset link
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trucks') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trucks_asset_id_fkey') THEN
            ALTER TABLE "trucks" ADD CONSTRAINT "trucks_asset_id_fkey"
                FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- Update crushers with asset link
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crushers') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crushers_asset_id_fkey') THEN
            ALTER TABLE "crushers" ADD CONSTRAINT "crushers_asset_id_fkey"
                FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

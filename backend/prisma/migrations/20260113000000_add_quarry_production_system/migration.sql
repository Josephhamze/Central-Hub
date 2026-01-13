-- CreateEnum
CREATE TYPE "Shift" AS ENUM ('DAY', 'NIGHT');
CREATE TYPE "EquipmentStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'DECOMMISSIONED');
CREATE TYPE "CrusherType" AS ENUM ('PRIMARY_JAW', 'SECONDARY_CONE', 'TERTIARY_VSI', 'SCREEN');
CREATE TYPE "EntryStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "QualityGrade" AS ENUM ('PREMIUM', 'STANDARD', 'OFF_SPEC');

-- CreateTable: excavators
CREATE TABLE "excavators" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bucket_capacity" DECIMAL(8,2) NOT NULL,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "excavators_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "excavators_name_key" ON "excavators"("name");
CREATE INDEX "excavators_status_idx" ON "excavators"("status");

-- CreateTable: trucks
CREATE TABLE "trucks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "load_capacity" DECIMAL(8,2) NOT NULL,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "trucks_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "trucks_name_key" ON "trucks"("name");
CREATE INDEX "trucks_status_idx" ON "trucks"("status");

-- CreateTable: crushers
CREATE TABLE "crushers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CrusherType" NOT NULL,
    "rated_capacity" DECIMAL(10,2) NOT NULL,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "crushers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "crushers_name_key" ON "crushers"("name");
CREATE INDEX "crushers_status_idx" ON "crushers"("status");
CREATE INDEX "crushers_type_idx" ON "crushers"("type");

-- CreateTable: pit_locations
CREATE TABLE "pit_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pit_locations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "pit_locations_name_key" ON "pit_locations"("name");
CREATE INDEX "pit_locations_is_active_idx" ON "pit_locations"("is_active");

-- CreateTable: material_types
CREATE TABLE "material_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "density" DECIMAL(8,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "material_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "material_types_name_key" ON "material_types"("name");
CREATE INDEX "material_types_is_active_idx" ON "material_types"("is_active");

-- CreateTable: product_types
CREATE TABLE "product_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "product_types_name_key" ON "product_types"("name");
CREATE INDEX "product_types_is_active_idx" ON "product_types"("is_active");

-- CreateTable: stockpile_locations
CREATE TABLE "stockpile_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "stockpile_locations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "stockpile_locations_name_key" ON "stockpile_locations"("name");
CREATE INDEX "stockpile_locations_is_active_idx" ON "stockpile_locations"("is_active");

-- CreateTable: excavator_entries
CREATE TABLE "excavator_entries" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "shift" "Shift" NOT NULL,
    "excavator_id" TEXT NOT NULL,
    "operator_id" TEXT NOT NULL,
    "material_type_id" TEXT NOT NULL,
    "pit_location_id" TEXT NOT NULL,
    "bucket_count" INTEGER NOT NULL,
    "estimated_volume" DECIMAL(10,2) NOT NULL,
    "estimated_tonnage" DECIMAL(10,2) NOT NULL,
    "downtime_hours" DECIMAL(5,2),
    "notes" TEXT,
    "status" "EntryStatus" NOT NULL DEFAULT 'PENDING',
    "approver_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "excavator_entries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "excavator_entries_date_shift_excavator_id_operator_id_key" ON "excavator_entries"("date", "shift", "excavator_id", "operator_id");
CREATE INDEX "excavator_entries_date_idx" ON "excavator_entries"("date");
CREATE INDEX "excavator_entries_shift_idx" ON "excavator_entries"("shift");
CREATE INDEX "excavator_entries_excavator_id_idx" ON "excavator_entries"("excavator_id");
CREATE INDEX "excavator_entries_operator_id_idx" ON "excavator_entries"("operator_id");
CREATE INDEX "excavator_entries_status_idx" ON "excavator_entries"("status");
CREATE INDEX "excavator_entries_created_by_id_idx" ON "excavator_entries"("created_by_id");

-- CreateTable: hauling_entries
CREATE TABLE "hauling_entries" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "shift" "Shift" NOT NULL,
    "truck_id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "excavator_entry_id" TEXT,
    "trip_count" INTEGER NOT NULL,
    "total_hauled" DECIMAL(10,2) NOT NULL,
    "avg_cycle_time" DECIMAL(5,2),
    "fuel_consumption" DECIMAL(8,2),
    "notes" TEXT,
    "status" "EntryStatus" NOT NULL DEFAULT 'PENDING',
    "approver_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "hauling_entries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "hauling_entries_date_shift_truck_id_driver_id_key" ON "hauling_entries"("date", "shift", "truck_id", "driver_id");
CREATE INDEX "hauling_entries_date_idx" ON "hauling_entries"("date");
CREATE INDEX "hauling_entries_shift_idx" ON "hauling_entries"("shift");
CREATE INDEX "hauling_entries_truck_id_idx" ON "hauling_entries"("truck_id");
CREATE INDEX "hauling_entries_driver_id_idx" ON "hauling_entries"("driver_id");
CREATE INDEX "hauling_entries_excavator_entry_id_idx" ON "hauling_entries"("excavator_entry_id");
CREATE INDEX "hauling_entries_status_idx" ON "hauling_entries"("status");
CREATE INDEX "hauling_entries_created_by_id_idx" ON "hauling_entries"("created_by_id");

-- CreateTable: crusher_feed_entries
CREATE TABLE "crusher_feed_entries" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "shift" "Shift" NOT NULL,
    "crusher_id" TEXT NOT NULL,
    "material_type_id" TEXT NOT NULL,
    "feed_start_time" TIMESTAMP(3) NOT NULL,
    "feed_end_time" TIMESTAMP(3) NOT NULL,
    "truck_loads_received" INTEGER NOT NULL,
    "weigh_bridge_tonnage" DECIMAL(10,2) NOT NULL,
    "feed_rate" DECIMAL(10,2),
    "reject_oversize_tonnage" DECIMAL(10,2),
    "notes" TEXT,
    "status" "EntryStatus" NOT NULL DEFAULT 'PENDING',
    "approver_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "crusher_feed_entries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "crusher_feed_entries_date_shift_crusher_id_key" ON "crusher_feed_entries"("date", "shift", "crusher_id");
CREATE INDEX "crusher_feed_entries_date_idx" ON "crusher_feed_entries"("date");
CREATE INDEX "crusher_feed_entries_shift_idx" ON "crusher_feed_entries"("shift");
CREATE INDEX "crusher_feed_entries_crusher_id_idx" ON "crusher_feed_entries"("crusher_id");
CREATE INDEX "crusher_feed_entries_material_type_id_idx" ON "crusher_feed_entries"("material_type_id");
CREATE INDEX "crusher_feed_entries_status_idx" ON "crusher_feed_entries"("status");
CREATE INDEX "crusher_feed_entries_created_by_id_idx" ON "crusher_feed_entries"("created_by_id");

-- CreateTable: crusher_output_entries
CREATE TABLE "crusher_output_entries" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "shift" "Shift" NOT NULL,
    "crusher_id" TEXT NOT NULL,
    "product_type_id" TEXT NOT NULL,
    "stockpile_location_id" TEXT NOT NULL,
    "output_tonnage" DECIMAL(10,2) NOT NULL,
    "yield_percentage" DECIMAL(5,2),
    "quality_grade" "QualityGrade" NOT NULL,
    "moisture_percentage" DECIMAL(5,2),
    "notes" TEXT,
    "status" "EntryStatus" NOT NULL DEFAULT 'PENDING',
    "approver_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "crusher_output_entries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "crusher_output_entries_date_idx" ON "crusher_output_entries"("date");
CREATE INDEX "crusher_output_entries_shift_idx" ON "crusher_output_entries"("shift");
CREATE INDEX "crusher_output_entries_crusher_id_idx" ON "crusher_output_entries"("crusher_id");
CREATE INDEX "crusher_output_entries_product_type_id_idx" ON "crusher_output_entries"("product_type_id");
CREATE INDEX "crusher_output_entries_stockpile_location_id_idx" ON "crusher_output_entries"("stockpile_location_id");
CREATE INDEX "crusher_output_entries_status_idx" ON "crusher_output_entries"("status");
CREATE INDEX "crusher_output_entries_created_by_id_idx" ON "crusher_output_entries"("created_by_id");

-- CreateTable: stock_levels
CREATE TABLE "stock_levels" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "product_type_id" TEXT NOT NULL,
    "stockpile_location_id" TEXT NOT NULL,
    "opening_stock" DECIMAL(12,2) NOT NULL,
    "produced" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sold" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "adjustments" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "adjustment_reason" TEXT,
    "closing_stock" DECIMAL(12,2) NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "stock_levels_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "stock_levels_date_product_type_id_stockpile_location_id_key" ON "stock_levels"("date", "product_type_id", "stockpile_location_id");
CREATE INDEX "stock_levels_date_idx" ON "stock_levels"("date");
CREATE INDEX "stock_levels_product_type_id_idx" ON "stock_levels"("product_type_id");
CREATE INDEX "stock_levels_stockpile_location_id_idx" ON "stock_levels"("stockpile_location_id");

-- AddForeignKey: excavator_entries
ALTER TABLE "excavator_entries" ADD CONSTRAINT "excavator_entries_excavator_id_fkey" FOREIGN KEY ("excavator_id") REFERENCES "excavators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "excavator_entries" ADD CONSTRAINT "excavator_entries_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "excavator_entries" ADD CONSTRAINT "excavator_entries_material_type_id_fkey" FOREIGN KEY ("material_type_id") REFERENCES "material_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "excavator_entries" ADD CONSTRAINT "excavator_entries_pit_location_id_fkey" FOREIGN KEY ("pit_location_id") REFERENCES "pit_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "excavator_entries" ADD CONSTRAINT "excavator_entries_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "excavator_entries" ADD CONSTRAINT "excavator_entries_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: hauling_entries
ALTER TABLE "hauling_entries" ADD CONSTRAINT "hauling_entries_truck_id_fkey" FOREIGN KEY ("truck_id") REFERENCES "trucks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hauling_entries" ADD CONSTRAINT "hauling_entries_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hauling_entries" ADD CONSTRAINT "hauling_entries_excavator_entry_id_fkey" FOREIGN KEY ("excavator_entry_id") REFERENCES "excavator_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hauling_entries" ADD CONSTRAINT "hauling_entries_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hauling_entries" ADD CONSTRAINT "hauling_entries_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: crusher_feed_entries
ALTER TABLE "crusher_feed_entries" ADD CONSTRAINT "crusher_feed_entries_crusher_id_fkey" FOREIGN KEY ("crusher_id") REFERENCES "crushers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "crusher_feed_entries" ADD CONSTRAINT "crusher_feed_entries_material_type_id_fkey" FOREIGN KEY ("material_type_id") REFERENCES "material_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "crusher_feed_entries" ADD CONSTRAINT "crusher_feed_entries_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "crusher_feed_entries" ADD CONSTRAINT "crusher_feed_entries_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: crusher_output_entries
ALTER TABLE "crusher_output_entries" ADD CONSTRAINT "crusher_output_entries_crusher_id_fkey" FOREIGN KEY ("crusher_id") REFERENCES "crushers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "crusher_output_entries" ADD CONSTRAINT "crusher_output_entries_product_type_id_fkey" FOREIGN KEY ("product_type_id") REFERENCES "product_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "crusher_output_entries" ADD CONSTRAINT "crusher_output_entries_stockpile_location_id_fkey" FOREIGN KEY ("stockpile_location_id") REFERENCES "stockpile_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "crusher_output_entries" ADD CONSTRAINT "crusher_output_entries_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "crusher_output_entries" ADD CONSTRAINT "crusher_output_entries_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: stock_levels
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_product_type_id_fkey" FOREIGN KEY ("product_type_id") REFERENCES "product_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_stockpile_location_id_fkey" FOREIGN KEY ("stockpile_location_id") REFERENCES "stockpile_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

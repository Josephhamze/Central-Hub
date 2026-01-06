-- Add Routes & Tolls System
-- This migration adds the complete routes, tolls, and costing system

-- Add VehicleType enum
CREATE TYPE "VehicleType" AS ENUM ('FLATBED', 'TIPPER');

-- Add TollPaymentStatus enum
CREATE TYPE "TollPaymentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'POSTED');

-- Extend routes table
ALTER TABLE "routes" ADD COLUMN "time_hours" DECIMAL(8, 2);
ALTER TABLE "routes" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "routes" ADD COLUMN "notes" TEXT;
ALTER TABLE "routes" ADD COLUMN "created_by_user_id" TEXT;
ALTER TABLE "routes" ALTER COLUMN "cost_per_km" DROP NOT NULL;

-- Create toll_stations table
CREATE TABLE "toll_stations" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "city_or_area" TEXT,
  "code" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "toll_stations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "toll_stations_code_key" ON "toll_stations"("code");
CREATE INDEX "toll_stations_is_active_idx" ON "toll_stations"("is_active");
CREATE INDEX "toll_stations_code_idx" ON "toll_stations"("code");

-- Create toll_rates table
CREATE TABLE "toll_rates" (
  "id" TEXT NOT NULL,
  "toll_station_id" TEXT NOT NULL,
  "vehicle_type" "VehicleType" NOT NULL,
  "amount" DECIMAL(10, 2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "effective_from" TIMESTAMP(3),
  "effective_to" TIMESTAMP(3),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "toll_rates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "toll_rates_toll_station_id_idx" ON "toll_rates"("toll_station_id");
CREATE INDEX "toll_rates_vehicle_type_idx" ON "toll_rates"("vehicle_type");
CREATE INDEX "toll_rates_is_active_idx" ON "toll_rates"("is_active");
CREATE INDEX "toll_rates_effective_from_idx" ON "toll_rates"("effective_from");
CREATE INDEX "toll_rates_effective_to_idx" ON "toll_rates"("effective_to");

-- Create route_toll_stations table
CREATE TABLE "route_toll_stations" (
  "id" TEXT NOT NULL,
  "route_id" TEXT NOT NULL,
  "toll_station_id" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "route_toll_stations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "route_toll_stations_route_id_toll_station_id_sort_order_key" ON "route_toll_stations"("route_id", "toll_station_id", "sort_order");
CREATE INDEX "route_toll_stations_route_id_idx" ON "route_toll_stations"("route_id");
CREATE INDEX "route_toll_stations_toll_station_id_idx" ON "route_toll_stations"("toll_station_id");
CREATE INDEX "route_toll_stations_is_active_idx" ON "route_toll_stations"("is_active");

-- Create route_cost_profiles table
CREATE TABLE "route_cost_profiles" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "vehicle_type" "VehicleType" NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "config_json" JSONB NOT NULL,
  "created_by_user_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "route_cost_profiles_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "route_cost_profiles_vehicle_type_idx" ON "route_cost_profiles"("vehicle_type");
CREATE INDEX "route_cost_profiles_is_active_idx" ON "route_cost_profiles"("is_active");
CREATE INDEX "route_cost_profiles_created_by_user_id_idx" ON "route_cost_profiles"("created_by_user_id");

-- Create route_costing_scenarios table
CREATE TABLE "route_costing_scenarios" (
  "id" TEXT NOT NULL,
  "route_id" TEXT NOT NULL,
  "cost_profile_id" TEXT NOT NULL,
  "trips_per_month" DECIMAL(10, 2),
  "planned_tonnage_per_month" DECIMAL(10, 2),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "route_costing_scenarios_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "route_costing_scenarios_route_id_cost_profile_id_key" ON "route_costing_scenarios"("route_id", "cost_profile_id");
CREATE INDEX "route_costing_scenarios_route_id_idx" ON "route_costing_scenarios"("route_id");
CREATE INDEX "route_costing_scenarios_cost_profile_id_idx" ON "route_costing_scenarios"("cost_profile_id");
CREATE INDEX "route_costing_scenarios_is_active_idx" ON "route_costing_scenarios"("is_active");

-- Create toll_payments table
CREATE TABLE "toll_payments" (
  "id" TEXT NOT NULL,
  "paid_at" TIMESTAMP(3) NOT NULL,
  "vehicle_type" "VehicleType" NOT NULL,
  "route_id" TEXT,
  "toll_station_id" TEXT,
  "amount" DECIMAL(10, 2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "receipt_ref" TEXT,
  "paid_by_user_id" TEXT,
  "notes" TEXT,
  "status" "TollPaymentStatus" NOT NULL DEFAULT 'DRAFT',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "toll_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "toll_payments_paid_at_idx" ON "toll_payments"("paid_at");
CREATE INDEX "toll_payments_vehicle_type_idx" ON "toll_payments"("vehicle_type");
CREATE INDEX "toll_payments_route_id_idx" ON "toll_payments"("route_id");
CREATE INDEX "toll_payments_toll_station_id_idx" ON "toll_payments"("toll_station_id");
CREATE INDEX "toll_payments_status_idx" ON "toll_payments"("status");
CREATE INDEX "toll_payments_paid_by_user_id_idx" ON "toll_payments"("paid_by_user_id");

-- Create toll_payment_attachments table
CREATE TABLE "toll_payment_attachments" (
  "id" TEXT NOT NULL,
  "toll_payment_id" TEXT NOT NULL,
  "file_path" TEXT NOT NULL,
  "file_name" TEXT NOT NULL,
  "mime_type" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "toll_payment_attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "toll_payment_attachments_toll_payment_id_idx" ON "toll_payment_attachments"("toll_payment_id");

-- Create route_snapshots table
CREATE TABLE "route_snapshots" (
  "id" TEXT NOT NULL,
  "route_id" TEXT NOT NULL,
  "snapshot_json" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "route_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "route_snapshots_route_id_idx" ON "route_snapshots"("route_id");
CREATE INDEX "route_snapshots_created_at_idx" ON "route_snapshots"("created_at");

-- Add foreign keys
ALTER TABLE "routes" ADD CONSTRAINT "routes_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "toll_rates" ADD CONSTRAINT "toll_rates_toll_station_id_fkey" FOREIGN KEY ("toll_station_id") REFERENCES "toll_stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "route_toll_stations" ADD CONSTRAINT "route_toll_stations_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "route_toll_stations" ADD CONSTRAINT "route_toll_stations_toll_station_id_fkey" FOREIGN KEY ("toll_station_id") REFERENCES "toll_stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "route_cost_profiles" ADD CONSTRAINT "route_cost_profiles_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "route_costing_scenarios" ADD CONSTRAINT "route_costing_scenarios_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "route_costing_scenarios" ADD CONSTRAINT "route_costing_scenarios_cost_profile_id_fkey" FOREIGN KEY ("cost_profile_id") REFERENCES "route_cost_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "toll_payments" ADD CONSTRAINT "toll_payments_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "toll_payments" ADD CONSTRAINT "toll_payments_toll_station_id_fkey" FOREIGN KEY ("toll_station_id") REFERENCES "toll_stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "toll_payments" ADD CONSTRAINT "toll_payments_paid_by_user_id_fkey" FOREIGN KEY ("paid_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "toll_payment_attachments" ADD CONSTRAINT "toll_payment_attachments_toll_payment_id_fkey" FOREIGN KEY ("toll_payment_id") REFERENCES "toll_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "route_snapshots" ADD CONSTRAINT "route_snapshots_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add indexes to routes table
CREATE INDEX "routes_from_city_idx" ON "routes"("from_city");
CREATE INDEX "routes_to_city_idx" ON "routes"("to_city");
CREATE INDEX "routes_is_active_idx" ON "routes"("is_active");
CREATE INDEX "routes_created_by_user_id_idx" ON "routes"("created_by_user_id");

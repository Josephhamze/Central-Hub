-- Property Management System Migration
-- This migration adds all tables and enums for the Property Management module

-- CreateEnum: PropertyType
CREATE TYPE "PropertyType" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'MIXED_USE', 'INDUSTRIAL', 'LAND');

-- CreateEnum: OwnershipType
CREATE TYPE "OwnershipType" AS ENUM ('OWNED', 'LEASED', 'MANAGED');

-- CreateEnum: PropertyStatus
CREATE TYPE "PropertyStatus" AS ENUM ('VACANT', 'OCCUPIED', 'UNDER_MAINTENANCE', 'LISTED', 'INACTIVE');

-- CreateEnum: TenantStatus
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'LATE', 'VACATED', 'BLACKLISTED', 'PENDING');

-- CreateEnum: LeaseType
CREATE TYPE "LeaseType" AS ENUM ('FIXED', 'MONTH_TO_MONTH', 'YEARLY');

-- CreateEnum: PaymentFrequency
CREATE TYPE "PaymentFrequency" AS ENUM ('WEEKLY', 'BI_WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY');

-- CreateEnum: PaymentMethod
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CHECK', 'CREDIT_CARD', 'MOBILE_PAYMENT', 'OTHER');

-- CreateEnum: RentPaymentStatus
CREATE TYPE "RentPaymentStatus" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'WAIVED', 'REFUNDED');

-- CreateEnum: UtilityType
CREATE TYPE "UtilityType" AS ENUM ('ELECTRICITY', 'WATER', 'GAS', 'INTERNET', 'REFUSE', 'SECURITY', 'SEWAGE', 'OTHER');

-- CreateEnum: ExpenseCategory
CREATE TYPE "ExpenseCategory" AS ENUM ('MAINTENANCE', 'REPAIRS', 'MUNICIPAL_TAXES', 'INSURANCE', 'MANAGEMENT_FEE', 'LEGAL', 'MARKETING', 'CLEANING', 'LANDSCAPING', 'PEST_CONTROL', 'OTHER');

-- CreateEnum: BillAllocation
CREATE TYPE "BillAllocation" AS ENUM ('LANDLORD', 'TENANT', 'SHARED');

-- CreateEnum: BillStatus
CREATE TYPE "BillStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'DISPUTED', 'CANCELLED');

-- CreateEnum: PropertyHealthStatus
CREATE TYPE "PropertyHealthStatus" AS ENUM ('HEALTHY', 'AT_RISK', 'UNDERPERFORMING', 'NON_PERFORMING');

-- CreateEnum: MaintenancePriority
CREATE TYPE "MaintenancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum: MaintenanceStatus
CREATE TYPE "MaintenanceStatus" AS ENUM ('PENDING', 'SCHEDULED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');


-- CreateTable: properties
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "property_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "property_type" "PropertyType" NOT NULL,
    "address_line1" TEXT NOT NULL,
    "address_line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "postal_code" TEXT,
    "country" TEXT NOT NULL,
    "gps_latitude" DECIMAL(10,8),
    "gps_longitude" DECIMAL(11,8),
    "unit_count" INTEGER NOT NULL DEFAULT 1,
    "floor_area" DECIMAL(10,2),
    "plot_size" DECIMAL(10,2),
    "floors" INTEGER,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "parking_spaces" INTEGER,
    "year_built" INTEGER,
    "description" TEXT,
    "amenities" JSONB,
    "ownership_type" "OwnershipType" NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'VACANT',
    "health_status" "PropertyHealthStatus",
    "purchase_date" TIMESTAMP(3),
    "purchase_value" DECIMAL(14,2),
    "current_market_value" DECIMAL(14,2),
    "current_rental_value" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "market_rent_estimate" DECIMAL(12,2),
    "last_valuation_date" TIMESTAMP(3),
    "annual_escalation_pct" DECIMAL(5,2),
    "documents_json" JSONB,
    "images_json" JSONB,
    "parent_property_id" TEXT,
    "company_id" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable: property_units
CREATE TABLE "property_units" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "unit_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floor_number" INTEGER,
    "floor_area" DECIMAL(10,2),
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "parking_spaces" INTEGER,
    "has_balcony" BOOLEAN NOT NULL DEFAULT false,
    "has_furnished" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "amenities" JSONB,
    "status" "PropertyStatus" NOT NULL DEFAULT 'VACANT',
    "base_rental_value" DECIMAL(12,2),
    "current_rental_value" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "electricity_meter" TEXT,
    "water_meter" TEXT,
    "gas_meter" TEXT,
    "images_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable: tenants
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "tenant_code" TEXT NOT NULL,
    "is_company" BOOLEAN NOT NULL DEFAULT false,
    "first_name" TEXT,
    "last_name" TEXT,
    "company_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "alternate_phone" TEXT,
    "id_type" TEXT,
    "id_number" TEXT,
    "tax_id" TEXT,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postal_code" TEXT,
    "country" TEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "status" "TenantStatus" NOT NULL DEFAULT 'PENDING',
    "current_balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "documents_json" JSONB,
    "notes" TEXT,
    "blacklist_reason" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable: leases
CREATE TABLE "leases" (
    "id" TEXT NOT NULL,
    "lease_code" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "unit_id" TEXT,
    "lease_type" "LeaseType" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "signed_date" TIMESTAMP(3),
    "rent_amount" DECIMAL(12,2) NOT NULL,
    "deposit_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "payment_frequency" "PaymentFrequency" NOT NULL,
    "payment_due_day" INTEGER NOT NULL DEFAULT 1,
    "grace_period_days" INTEGER NOT NULL DEFAULT 5,
    "late_fee_amount" DECIMAL(10,2),
    "late_fee_percentage" DECIMAL(5,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "has_escalation" BOOLEAN NOT NULL DEFAULT false,
    "escalation_pct" DECIMAL(5,2),
    "escalation_date" TIMESTAMP(3),
    "next_escalation_date" TIMESTAMP(3),
    "preferred_payment_method" "PaymentMethod",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "terminated_date" TIMESTAMP(3),
    "termination_reason" TEXT,
    "utilities_included" JSONB,
    "contract_document_url" TEXT,
    "documents_json" JSONB,
    "special_terms" TEXT,
    "notes" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leases_pkey" PRIMARY KEY ("id")
);

-- CreateTable: rent_schedules
CREATE TABLE "rent_schedules" (
    "id" TEXT NOT NULL,
    "lease_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "rent_amount" DECIMAL(12,2) NOT NULL,
    "additional_charges" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_due" DECIMAL(12,2) NOT NULL,
    "amount_paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(12,2) NOT NULL,
    "status" "RentPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "late_fee_applied" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rent_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable: rent_payments
CREATE TABLE "rent_payments" (
    "id" TEXT NOT NULL,
    "payment_code" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "lease_id" TEXT NOT NULL,
    "rent_schedule_id" TEXT,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "reference_number" TEXT,
    "rent_portion" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "late_fees_portion" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deposit_portion" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "other_portion" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "RentPaymentStatus" NOT NULL DEFAULT 'PAID',
    "is_refund" BOOLEAN NOT NULL DEFAULT false,
    "receipt_number" TEXT,
    "receipt_url" TEXT,
    "notes" TEXT,
    "received_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rent_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: property_expenses
CREATE TABLE "property_expenses" (
    "id" TEXT NOT NULL,
    "expense_code" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "vendor" TEXT,
    "expense_date" TIMESTAMP(3) NOT NULL,
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "tax_amount" DECIMAL(10,2),
    "total_amount" DECIMAL(12,2) NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "paid_date" TIMESTAMP(3),
    "payment_method" "PaymentMethod",
    "payment_reference" TEXT,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurring_frequency" "PaymentFrequency",
    "invoice_number" TEXT,
    "invoice_url" TEXT,
    "receipt_url" TEXT,
    "notes" TEXT,
    "budget_category" TEXT,
    "is_capex" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable: utility_bills
CREATE TABLE "utility_bills" (
    "id" TEXT NOT NULL,
    "bill_code" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "unit_id" TEXT,
    "utility_type" "UtilityType" NOT NULL,
    "provider" TEXT,
    "account_number" TEXT,
    "billing_period_start" TIMESTAMP(3) NOT NULL,
    "billing_period_end" TIMESTAMP(3) NOT NULL,
    "bill_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "previous_reading" DECIMAL(12,2),
    "current_reading" DECIMAL(12,2),
    "consumption" DECIMAL(12,2),
    "consumption_unit" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "tax_amount" DECIMAL(10,2),
    "total_amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "allocation" "BillAllocation" NOT NULL DEFAULT 'LANDLORD',
    "tenant_share_pct" DECIMAL(5,2),
    "status" "BillStatus" NOT NULL DEFAULT 'PENDING',
    "paid_date" TIMESTAMP(3),
    "paid_amount" DECIMAL(12,2),
    "payment_reference" TEXT,
    "bill_url" TEXT,
    "notes" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utility_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable: property_maintenance_jobs
CREATE TABLE "property_maintenance_jobs" (
    "id" TEXT NOT NULL,
    "job_code" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "unit_id" TEXT,
    "work_order_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "priority" "MaintenancePriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'PENDING',
    "reported_date" TIMESTAMP(3) NOT NULL,
    "scheduled_date" TIMESTAMP(3),
    "started_date" TIMESTAMP(3),
    "completed_date" TIMESTAMP(3),
    "assigned_to" TEXT,
    "contractor_id" TEXT,
    "estimated_cost" DECIMAL(12,2),
    "actual_cost" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "budget_code" TEXT,
    "affects_occupancy" BOOLEAN NOT NULL DEFAULT false,
    "vacancy_days_impact" INTEGER,
    "before_photos_json" JSONB,
    "after_photos_json" JSONB,
    "invoice_url" TEXT,
    "reported_by_tenant_id" TEXT,
    "tenant_access_required" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "resolution_notes" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_maintenance_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: property_kpi_snapshots
CREATE TABLE "property_kpi_snapshots" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "snapshot_date" TIMESTAMP(3) NOT NULL,
    "period" TEXT NOT NULL,
    "occupancy_rate" DECIMAL(5,2),
    "vacancy_rate" DECIMAL(5,2),
    "total_units" INTEGER,
    "occupied_units" INTEGER,
    "vacant_units" INTEGER,
    "avg_lease_duration" DECIMAL(8,2),
    "tenant_turnover_rate" DECIMAL(5,2),
    "active_leases" INTEGER,
    "expiring_leases_30" INTEGER,
    "expiring_leases_60" INTEGER,
    "expiring_leases_90" INTEGER,
    "rental_income" DECIMAL(14,2),
    "rent_collected" DECIMAL(14,2),
    "rent_billed" DECIMAL(14,2),
    "collection_rate" DECIMAL(5,2),
    "arrears_amount" DECIMAL(14,2),
    "arrears_percentage" DECIMAL(5,2),
    "operating_expenses" DECIMAL(14,2),
    "maintenance_costs" DECIMAL(14,2),
    "utility_costs" DECIMAL(14,2),
    "net_operating_income" DECIMAL(14,2),
    "gross_yield" DECIMAL(5,2),
    "net_yield" DECIMAL(5,2),
    "cash_flow" DECIMAL(14,2),
    "market_value" DECIMAL(14,2),
    "cap_rate" DECIMAL(5,2),
    "health_status" "PropertyHealthStatus",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_kpi_snapshots_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX "properties_property_code_key" ON "properties"("property_code");
CREATE INDEX "properties_property_code_idx" ON "properties"("property_code");
CREATE INDEX "properties_property_type_idx" ON "properties"("property_type");
CREATE INDEX "properties_status_idx" ON "properties"("status");
CREATE INDEX "properties_health_status_idx" ON "properties"("health_status");
CREATE INDEX "properties_city_idx" ON "properties"("city");
CREATE INDEX "properties_company_id_idx" ON "properties"("company_id");
CREATE INDEX "properties_parent_property_id_idx" ON "properties"("parent_property_id");

-- CreateIndex: property_units
CREATE UNIQUE INDEX "property_units_property_id_unit_code_key" ON "property_units"("property_id", "unit_code");
CREATE INDEX "property_units_property_id_idx" ON "property_units"("property_id");
CREATE INDEX "property_units_status_idx" ON "property_units"("status");

-- CreateIndex: tenants
CREATE UNIQUE INDEX "tenants_tenant_code_key" ON "tenants"("tenant_code");
CREATE INDEX "tenants_tenant_code_idx" ON "tenants"("tenant_code");
CREATE INDEX "tenants_status_idx" ON "tenants"("status");
CREATE INDEX "tenants_email_idx" ON "tenants"("email");

-- CreateIndex: leases
CREATE UNIQUE INDEX "leases_lease_code_key" ON "leases"("lease_code");
CREATE INDEX "leases_lease_code_idx" ON "leases"("lease_code");
CREATE INDEX "leases_tenant_id_idx" ON "leases"("tenant_id");
CREATE INDEX "leases_property_id_idx" ON "leases"("property_id");
CREATE INDEX "leases_unit_id_idx" ON "leases"("unit_id");
CREATE INDEX "leases_is_active_idx" ON "leases"("is_active");
CREATE INDEX "leases_start_date_idx" ON "leases"("start_date");
CREATE INDEX "leases_end_date_idx" ON "leases"("end_date");

-- CreateIndex: rent_schedules
CREATE UNIQUE INDEX "rent_schedules_lease_id_period_start_key" ON "rent_schedules"("lease_id", "period_start");
CREATE INDEX "rent_schedules_lease_id_idx" ON "rent_schedules"("lease_id");
CREATE INDEX "rent_schedules_due_date_idx" ON "rent_schedules"("due_date");
CREATE INDEX "rent_schedules_status_idx" ON "rent_schedules"("status");

-- CreateIndex: rent_payments
CREATE UNIQUE INDEX "rent_payments_payment_code_key" ON "rent_payments"("payment_code");
CREATE INDEX "rent_payments_payment_code_idx" ON "rent_payments"("payment_code");
CREATE INDEX "rent_payments_tenant_id_idx" ON "rent_payments"("tenant_id");
CREATE INDEX "rent_payments_lease_id_idx" ON "rent_payments"("lease_id");
CREATE INDEX "rent_payments_rent_schedule_id_idx" ON "rent_payments"("rent_schedule_id");
CREATE INDEX "rent_payments_payment_date_idx" ON "rent_payments"("payment_date");
CREATE INDEX "rent_payments_status_idx" ON "rent_payments"("status");

-- CreateIndex: property_expenses
CREATE UNIQUE INDEX "property_expenses_expense_code_key" ON "property_expenses"("expense_code");
CREATE INDEX "property_expenses_expense_code_idx" ON "property_expenses"("expense_code");
CREATE INDEX "property_expenses_property_id_idx" ON "property_expenses"("property_id");
CREATE INDEX "property_expenses_category_idx" ON "property_expenses"("category");
CREATE INDEX "property_expenses_expense_date_idx" ON "property_expenses"("expense_date");
CREATE INDEX "property_expenses_is_paid_idx" ON "property_expenses"("is_paid");

-- CreateIndex: utility_bills
CREATE UNIQUE INDEX "utility_bills_bill_code_key" ON "utility_bills"("bill_code");
CREATE INDEX "utility_bills_bill_code_idx" ON "utility_bills"("bill_code");
CREATE INDEX "utility_bills_property_id_idx" ON "utility_bills"("property_id");
CREATE INDEX "utility_bills_unit_id_idx" ON "utility_bills"("unit_id");
CREATE INDEX "utility_bills_utility_type_idx" ON "utility_bills"("utility_type");
CREATE INDEX "utility_bills_billing_period_start_idx" ON "utility_bills"("billing_period_start");
CREATE INDEX "utility_bills_status_idx" ON "utility_bills"("status");
CREATE INDEX "utility_bills_due_date_idx" ON "utility_bills"("due_date");

-- CreateIndex: property_maintenance_jobs
CREATE UNIQUE INDEX "property_maintenance_jobs_job_code_key" ON "property_maintenance_jobs"("job_code");
CREATE INDEX "property_maintenance_jobs_job_code_idx" ON "property_maintenance_jobs"("job_code");
CREATE INDEX "property_maintenance_jobs_property_id_idx" ON "property_maintenance_jobs"("property_id");
CREATE INDEX "property_maintenance_jobs_unit_id_idx" ON "property_maintenance_jobs"("unit_id");
CREATE INDEX "property_maintenance_jobs_status_idx" ON "property_maintenance_jobs"("status");
CREATE INDEX "property_maintenance_jobs_priority_idx" ON "property_maintenance_jobs"("priority");
CREATE INDEX "property_maintenance_jobs_scheduled_date_idx" ON "property_maintenance_jobs"("scheduled_date");

-- CreateIndex: property_kpi_snapshots
CREATE UNIQUE INDEX "property_kpi_snapshots_property_id_period_key" ON "property_kpi_snapshots"("property_id", "period");
CREATE INDEX "property_kpi_snapshots_property_id_idx" ON "property_kpi_snapshots"("property_id");
CREATE INDEX "property_kpi_snapshots_snapshot_date_idx" ON "property_kpi_snapshots"("snapshot_date");
CREATE INDEX "property_kpi_snapshots_period_idx" ON "property_kpi_snapshots"("period");


-- AddForeignKey: properties (self-referential for hierarchy)
ALTER TABLE "properties" ADD CONSTRAINT "properties_parent_property_id_fkey" FOREIGN KEY ("parent_property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: property_units -> properties
ALTER TABLE "property_units" ADD CONSTRAINT "property_units_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: leases -> tenants
ALTER TABLE "leases" ADD CONSTRAINT "leases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: leases -> properties
ALTER TABLE "leases" ADD CONSTRAINT "leases_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: leases -> property_units
ALTER TABLE "leases" ADD CONSTRAINT "leases_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "property_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: rent_schedules -> leases
ALTER TABLE "rent_schedules" ADD CONSTRAINT "rent_schedules_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "leases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: rent_payments -> tenants
ALTER TABLE "rent_payments" ADD CONSTRAINT "rent_payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: rent_payments -> leases
ALTER TABLE "rent_payments" ADD CONSTRAINT "rent_payments_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "leases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: rent_payments -> rent_schedules
ALTER TABLE "rent_payments" ADD CONSTRAINT "rent_payments_rent_schedule_id_fkey" FOREIGN KEY ("rent_schedule_id") REFERENCES "rent_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: property_expenses -> properties
ALTER TABLE "property_expenses" ADD CONSTRAINT "property_expenses_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: utility_bills -> properties
ALTER TABLE "utility_bills" ADD CONSTRAINT "utility_bills_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: utility_bills -> property_units
ALTER TABLE "utility_bills" ADD CONSTRAINT "utility_bills_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "property_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: property_maintenance_jobs -> properties
ALTER TABLE "property_maintenance_jobs" ADD CONSTRAINT "property_maintenance_jobs_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: property_maintenance_jobs -> property_units
ALTER TABLE "property_maintenance_jobs" ADD CONSTRAINT "property_maintenance_jobs_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "property_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: property_kpi_snapshots -> properties
ALTER TABLE "property_kpi_snapshots" ADD CONSTRAINT "property_kpi_snapshots_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

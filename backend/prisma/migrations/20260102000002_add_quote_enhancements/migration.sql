-- CreateEnum
CREATE TYPE "PaymentTerms" AS ENUM ('CASH_ON_DELIVERY', 'DAYS_15', 'DAYS_30');
CREATE TYPE "TruckType" AS ENUM ('TIPPER_42T', 'CANTER');
CREATE TYPE "LossReasonCategory" AS ENUM ('PRICE_TOO_HIGH', 'FOUND_BETTER_DEAL', 'PROJECT_CANCELLED', 'DELIVERY_TIMING', 'QUALITY_CONCERNS', 'OTHER');

-- AlterTable: quotes
-- Add new columns
ALTER TABLE "quotes" ADD COLUMN "validity_days" INTEGER NOT NULL DEFAULT 7;
ALTER TABLE "quotes" ADD COLUMN "payment_terms" "PaymentTerms";
ALTER TABLE "quotes" ADD COLUMN "delivery_start_date" TIMESTAMP(3);
ALTER TABLE "quotes" ADD COLUMN "loads_per_day" INTEGER;
ALTER TABLE "quotes" ADD COLUMN "truck_type" "TruckType";
ALTER TABLE "quotes" ADD COLUMN "loss_reason_category" "LossReasonCategory";

-- Convert discount_total (amount) to discount_percentage
-- First, add the new column
ALTER TABLE "quotes" ADD COLUMN "discount_percentage_new" DECIMAL(5,2) DEFAULT 0;

-- Calculate percentage from existing discount_total and subtotal
-- Formula: (discount_total / subtotal) * 100, but handle division by zero
UPDATE "quotes" 
SET "discount_percentage_new" = CASE 
    WHEN "subtotal" > 0 THEN 
        LEAST(100, GREATEST(0, ("discount_total" / "subtotal") * 100))
    ELSE 0
END;

-- Drop old column
ALTER TABLE "quotes" DROP COLUMN "discount_total";

-- Rename new column
ALTER TABLE "quotes" RENAME COLUMN "discount_percentage_new" TO "discount_percentage";

-- Set default for discount_percentage
ALTER TABLE "quotes" ALTER COLUMN "discount_percentage" SET DEFAULT 0;

-- Drop old outcome_reason_category column (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'outcome_reason_category') THEN
        ALTER TABLE "quotes" DROP COLUMN "outcome_reason_category";
    END IF;
END $$;

-- AlterTable: quote_items
-- Convert discount (amount) to discount_percentage for quote_items
-- First, add the new column
ALTER TABLE "quote_items" ADD COLUMN "discount_percentage_new" DECIMAL(5,2) DEFAULT 0;

-- Calculate percentage from existing discount and unit_price
-- Formula: (discount / unit_price) * 100, but handle division by zero
UPDATE "quote_items" 
SET "discount_percentage_new" = CASE 
    WHEN "unit_price" > 0 THEN 
        LEAST(100, GREATEST(0, ("discount" / "unit_price") * 100))
    ELSE 0
END;

-- Drop old column
ALTER TABLE "quote_items" DROP COLUMN "discount";

-- Rename new column
ALTER TABLE "quote_items" RENAME COLUMN "discount_percentage_new" TO "discount_percentage";

-- Set default for discount_percentage
ALTER TABLE "quote_items" ALTER COLUMN "discount_percentage" SET DEFAULT 0;

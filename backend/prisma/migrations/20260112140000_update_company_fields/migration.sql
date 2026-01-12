-- Remove old fields and add new fields to companies table
ALTER TABLE "companies" 
  DROP COLUMN IF EXISTS "registration_no",
  DROP COLUMN IF EXISTS "tax_no",
  DROP COLUMN IF EXISTS "postal_code",
  ADD COLUMN IF NOT EXISTS "nif" TEXT,
  ADD COLUMN IF NOT EXISTS "rccm" TEXT,
  ADD COLUMN IF NOT EXISTS "id_national" TEXT,
  ADD COLUMN IF NOT EXISTS "vat" TEXT;

-- Logo URL already exists, no change needed

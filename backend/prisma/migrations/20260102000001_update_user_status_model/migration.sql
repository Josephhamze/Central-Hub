-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "account_status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deactivated_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deactivated_by" TEXT;

-- Migrate existing data: Convert isActive to accountStatus
UPDATE "users" 
SET "account_status" = CASE 
  WHEN "is_active" = true THEN 'ACTIVE'
  WHEN "is_active" = false THEN 'DISABLED'
  ELSE 'PENDING'
END
WHERE "account_status" IS NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "users_account_status_idx" ON "users"("account_status");
CREATE INDEX IF NOT EXISTS "users_email_verified_idx" ON "users"("email_verified");

-- Note: is_active column will be dropped in a future migration after verifying the new system works
-- ALTER TABLE "users" DROP COLUMN "is_active";

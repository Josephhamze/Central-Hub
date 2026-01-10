-- Update TruckType enum to replace CANTER with FLATBED_40T
-- First, update any existing records
UPDATE quotes SET truck_type = 'TIPPER_42T' WHERE truck_type = 'CANTER';

-- Drop and recreate the enum
ALTER TYPE "TruckType" RENAME TO "TruckType_old";
CREATE TYPE "TruckType" AS ENUM ('TIPPER_42T', 'FLATBED_40T');

-- Update the column to use the new enum
ALTER TABLE quotes 
  ALTER COLUMN truck_type TYPE "TruckType" 
  USING truck_type::text::"TruckType";

-- Drop the old enum
DROP TYPE "TruckType_old";

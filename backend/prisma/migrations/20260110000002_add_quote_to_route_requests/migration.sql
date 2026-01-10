-- Add quoteId and approvedRouteId to route_requests table
-- Make fromCity, toCity, and distanceKm nullable

-- First, update existing records to handle nulls
UPDATE route_requests SET from_city = NULL WHERE from_city = '';
UPDATE route_requests SET to_city = NULL WHERE to_city = '';
UPDATE route_requests SET distance_km = NULL WHERE distance_km = 0;

-- Add new columns
ALTER TABLE route_requests 
  ADD COLUMN quote_id TEXT,
  ADD COLUMN approved_route_id TEXT;

-- Make existing columns nullable
ALTER TABLE route_requests 
  ALTER COLUMN from_city DROP NOT NULL,
  ALTER COLUMN to_city DROP NOT NULL,
  ALTER COLUMN distance_km DROP NOT NULL;

-- Add foreign key constraints
ALTER TABLE route_requests 
  ADD CONSTRAINT route_requests_quote_id_fkey 
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL,
  ADD CONSTRAINT route_requests_approved_route_id_fkey 
    FOREIGN KEY (approved_route_id) REFERENCES routes(id) ON DELETE SET NULL;

-- Add indexes
CREATE INDEX route_requests_quote_id_idx ON route_requests(quote_id);

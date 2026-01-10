-- CreateEnum
CREATE TYPE "RouteRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "route_requests" (
    "id" TEXT NOT NULL,
    "from_city" TEXT NOT NULL,
    "to_city" TEXT NOT NULL,
    "distance_km" DECIMAL(10,2) NOT NULL,
    "time_hours" DECIMAL(8,2),
    "warehouse_id" TEXT,
    "notes" TEXT,
    "status" "RouteRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requested_by_user_id" TEXT NOT NULL,
    "reviewed_by_user_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "route_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "route_requests_status_idx" ON "route_requests"("status");

-- CreateIndex
CREATE INDEX "route_requests_requested_by_user_id_idx" ON "route_requests"("requested_by_user_id");

-- CreateIndex
CREATE INDEX "route_requests_reviewed_by_user_id_idx" ON "route_requests"("reviewed_by_user_id");

-- AddForeignKey
ALTER TABLE "route_requests" ADD CONSTRAINT "route_requests_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_requests" ADD CONSTRAINT "route_requests_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_requests" ADD CONSTRAINT "route_requests_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

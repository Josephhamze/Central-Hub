#!/bin/sh
set -e

# Resolve any failed migrations first (ignore errors if migration doesn't exist or is already resolved)
echo "Checking for failed migrations..."
pnpm dlx prisma@6.19.1 migrate resolve --rolled-back 20260113160000_add_project_asset_stock_integration 2>/dev/null || echo "No failed migration to resolve or already resolved"

# Run migrations using pnpm dlx (downloads and runs specific version)
echo "Running database migrations..."
pnpm dlx prisma@6.19.1 migrate deploy

# Seed database (upsert, safe to run multiple times)
echo "Seeding database with permissions..."
pnpm dlx prisma@6.19.1 db seed || echo "Seed completed (some items may already exist)"

# Start the application
echo "Starting NestJS application..."
exec node dist/src/main.js

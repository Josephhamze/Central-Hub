#!/bin/sh
set -e

# Run migrations using pnpm dlx (downloads and runs specific version)
echo "Running database migrations..."
pnpm dlx prisma@6.19.1 migrate deploy

# Seed database (upsert, safe to run multiple times)
echo "Seeding database with permissions..."
pnpm dlx prisma@6.19.1 db seed || echo "Seed completed (some items may already exist)"

# Start the application
echo "Starting NestJS application..."
exec node dist/src/main.js

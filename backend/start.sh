#!/bin/sh
set -e

# Run migrations
echo "Running database migrations..."
pnpm prisma migrate deploy

# Seed database (upsert, safe to run multiple times)
echo "Seeding database with permissions..."
pnpm prisma db seed || echo "Seed completed (some items may already exist)"

# Start the application
echo "Starting NestJS application..."
exec node dist/src/main.js

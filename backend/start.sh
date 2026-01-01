#!/bin/sh
set -e

# Run migrations
echo "Running database migrations..."
pnpm prisma migrate deploy

# Start the application
echo "Starting NestJS application..."
exec node dist/main.js

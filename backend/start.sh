#!/bin/sh
set -e

# Debug: List what's in /app
echo "Contents of /app:"
ls -la /app || true

echo "Contents of /app/dist (if exists):"
ls -la /app/dist || echo "dist folder does not exist"

# Run migrations
echo "Running database migrations..."
pnpm prisma migrate deploy

# Start the application
echo "Starting NestJS application..."
if [ -f "/app/dist/main.js" ]; then
  exec node dist/main.js
else
  echo "ERROR: /app/dist/main.js not found!"
  echo "Build output location:"
  find /app -name "main.js" -type f 2>/dev/null || echo "No main.js found anywhere"
  exit 1
fi

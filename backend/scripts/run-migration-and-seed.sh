#!/bin/bash
# Script to run migration and seed for Routes & Tolls system
# This can be run manually or added to Railway deployment

set -e

echo "🚀 Running database migration..."
npx prisma migrate deploy

echo "🌱 Seeding permissions..."
npx prisma db seed

echo "✅ Migration and seed completed successfully!"

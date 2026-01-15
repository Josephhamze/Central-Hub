#!/bin/bash
# Script to run database migration and seed
# Run this after deploying to AWS EC2

set -e

echo "🚀 Running database migration..."
npx prisma migrate deploy

echo "🌱 Seeding permissions..."
npx prisma db seed

echo "✅ Migration and seed completed successfully!"

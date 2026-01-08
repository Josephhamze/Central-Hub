#!/bin/bash

# Database Migration Script
# Exports from Railway PostgreSQL and imports to AWS RDS

set -e

echo "🚀 Starting database migration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required tools are installed
command -v pg_dump >/dev/null 2>&1 || { echo -e "${RED}Error: pg_dump is not installed.${NC}" >&2; exit 1; }
command -v psql >/dev/null 2>&1 || { echo -e "${RED}Error: psql is not installed.${NC}" >&2; exit 1; }

# Get Railway database URL
echo -e "${YELLOW}Enter your Railway PostgreSQL connection string:${NC}"
read -s RAILWAY_DB_URL
echo ""

# Get RDS connection string
echo -e "${YELLOW}Enter your AWS RDS PostgreSQL connection string:${NC}"
echo -e "${YELLOW}(Format: postgresql://user:password@host:port/database)${NC}"
read -s RDS_DB_URL
echo ""

# Backup file
BACKUP_FILE="railway_backup_$(date +%Y%m%d_%H%M%S).sql"

echo -e "${GREEN}📦 Exporting data from Railway...${NC}"
pg_dump "$RAILWAY_DB_URL" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Export successful! Backup saved to: $BACKUP_FILE${NC}"
    echo -e "${YELLOW}Backup size: $(du -h "$BACKUP_FILE" | cut -f1)${NC}"
else
    echo -e "${RED}❌ Export failed!${NC}"
    exit 1
fi

# Ask for confirmation before importing
echo ""
echo -e "${YELLOW}⚠️  Ready to import to RDS. This will overwrite existing data.${NC}"
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}Migration cancelled.${NC}"
    exit 0
fi

echo -e "${GREEN}📥 Importing data to RDS...${NC}"
psql "$RDS_DB_URL" < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Import successful!${NC}"
    echo ""
    echo -e "${GREEN}🎉 Database migration completed!${NC}"
    echo -e "${YELLOW}Backup file kept at: $BACKUP_FILE${NC}"
else
    echo -e "${RED}❌ Import failed!${NC}"
    exit 1
fi

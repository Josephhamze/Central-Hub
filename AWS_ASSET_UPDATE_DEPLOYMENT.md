# Asset Model Update - AWS EC2 Deployment Instructions

This guide will help you deploy the new asset creation model update to your AWS EC2 server running Docker.

## What Changed

- ✅ New asset fields organized into 8 sections (ASSET IDENTITY, ALLOCATION, IDENTIFICATION, etc.)
- ✅ New database migration: `20260114000000_update_asset_model_with_new_fields`
- ✅ Updated backend DTOs and service
- ✅ Updated frontend form with organized sections

## Prerequisites

- SSH access to your EC2 instance
- Docker and Docker Compose installed on EC2
- Access to your RDS PostgreSQL database
- Access to your Redis instance
- Git repository access

---

## Step 1: Connect to Your EC2 Server

```bash
# SSH into your EC2 instance
ssh -i /path/to/your-key.pem ec2-user@your-ec2-ip-or-domain

# Or if using AWS Systems Manager Session Manager
aws ssm start-session --target i-xxxxxxxxxxxxx
```

---

## Step 2: Navigate to Your Application Directory

```bash
# Navigate to your application directory (adjust path as needed)
cd /path/to/your/app
# Common locations:
# - /home/ec2-user/app
# - /opt/app
# - /var/www/app
```

---

## Step 3: Pull Latest Code from Git

```bash
# Pull the latest changes from main branch
git pull origin main

# Verify the new migration file exists
ls -la backend/prisma/migrations/20260114000000_update_asset_model_with_new_fields/
```

---

## Step 4: Run Database Migration (REQUIRED)

The database schema has changed, so you **must** run the migration before restarting the backend.

### Option A: Run Migration via Docker (Recommended)

```bash
# If you have a backend container running
docker-compose exec backend pnpm prisma migrate deploy

# Or if using docker run
docker exec -it your-backend-container-name pnpm prisma migrate deploy
```

### Option B: Run Migration Directly on EC2

```bash
# Navigate to backend directory
cd backend

# Set your DATABASE_URL (if not in .env)
export DATABASE_URL="postgresql://username:password@your-rds-endpoint:5432/dbname?schema=public"

# Install dependencies if needed
pnpm install

# Run the migration
pnpm prisma migrate deploy

# Or using npx
npx prisma migrate deploy
```

### Option C: Run Migration via psql (Manual)

```bash
# Connect to your RDS database
psql "postgresql://username:password@your-rds-endpoint:5432/dbname"

# Then run the migration SQL file
\i backend/prisma/migrations/20260114000000_update_asset_model_with_new_fields/migration.sql
```

Or using psql directly:

```bash
psql "postgresql://username:password@your-rds-endpoint:5432/dbname" \
  < backend/prisma/migrations/20260114000000_update_asset_model_with_new_fields/migration.sql
```

### Verify Migration

After running the migration, verify it worked:

```bash
# Connect to database
psql "postgresql://username:password@your-rds-endpoint:5432/dbname"

# Check if new columns exist
\d assets

# You should see new columns like:
# - asset_name (renamed from name)
# - type, family, year_model, color
# - company_id, company_code, country_of_registration
# - purchase_date, purchase_value, currency
# - install_date, end_of_life_date
# - index_type, current_index
# - status_since, availability_percent
# - last_maintenance_date, next_maintenance_date
# etc.
```

---

## Step 5: Rebuild and Restart Docker Containers

### Option A: Using Docker Compose (Recommended)

```bash
# Navigate to directory with docker-compose.yml
cd /path/to/your/app

# Rebuild backend container (to get new code)
docker-compose build backend

# Or rebuild all services
docker-compose build

# Restart the backend service
docker-compose up -d backend

# Or restart all services
docker-compose up -d

# Check logs to ensure it started correctly
docker-compose logs -f backend
```

### Option B: Using Docker Run

```bash
# Stop the existing backend container
docker stop your-backend-container-name

# Remove the old container (optional, if you want a fresh start)
docker rm your-backend-container-name

# Rebuild the Docker image
cd backend
docker build -t your-backend-image-name .

# Start the new container
docker run -d \
  --name your-backend-container-name \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_URL="redis://..." \
  -e JWT_SECRET="..." \
  -e JWT_REFRESH_SECRET="..." \
  your-backend-image-name

# Check logs
docker logs -f your-backend-container-name
```

### Option C: If Using start.sh Script

If your Docker container runs migrations automatically via `start.sh`:

```bash
# Just restart the container - migration will run automatically
docker-compose restart backend

# Or rebuild and restart
docker-compose up -d --build backend
```

---

## Step 6: Clear Redis Cache (Optional but Recommended)

Since the asset model changed, clear the Redis cache to avoid stale data:

```bash
# If Redis is in Docker
docker-compose exec redis redis-cli FLUSHALL

# Or if Redis is external
redis-cli -h your-redis-host -p 6379 FLUSHALL

# Or via Docker exec
docker exec -it your-redis-container-name redis-cli FLUSHALL
```

---

## Step 7: Rebuild and Deploy Frontend

### If Frontend Runs on EC2 (Docker)

```bash
# Rebuild frontend container
docker-compose build frontend

# Restart frontend service
docker-compose up -d frontend

# Check logs
docker-compose logs -f frontend
```

### If Frontend is Deployed to S3 + CloudFront

```bash
# On your local machine or CI/CD server
cd frontend

# Set your API URL (if not already in .env)
export VITE_API_URL=https://your-backend-api-url/api/v1

# Install dependencies (if needed)
pnpm install

# Build the frontend
pnpm build

# Upload to S3
aws s3 sync dist/ s3://your-frontend-bucket/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### If Frontend is Served by Nginx on EC2

```bash
# Build frontend on EC2
cd frontend
pnpm install
pnpm build

# Copy to nginx directory (adjust paths as needed)
sudo cp -r dist/* /usr/share/nginx/html/

# Or if using a different location
sudo cp -r dist/* /var/www/html/

# Restart nginx
sudo systemctl restart nginx
# Or
sudo service nginx restart
```

---

## Step 8: Verify Deployment

### Check Backend Health

```bash
# From EC2 server
curl http://localhost:3000/api/v1/health

# Or from your local machine
curl https://your-backend-api-url/api/v1/health

# Should return: {"status":"ok"}
```

### Check Backend Logs

```bash
# Docker Compose
docker-compose logs -f backend

# Docker
docker logs -f your-backend-container-name

# Look for any errors or warnings
```

### Test Asset Endpoint

```bash
# Test assets endpoint (should return new structure)
curl https://your-backend-api-url/api/v1/assets
```

### Test Frontend

1. Open your website in a browser
2. Navigate to the Asset Registry page
3. Click "Create Asset"
4. Verify that the form has all the new sections:
   - ASSET IDENTITY
   - ALLOCATION
   - IDENTIFICATION
   - FINANCIAL INFORMATION
   - LIFECYCLE
   - Index Details
   - STATUS
   - MAINTENANCE

---

## Step 9: Test the Update

### Test Asset Creation

1. Go to Asset Registry page
2. Click "Create Asset"
3. Fill in the required fields:
   - Asset Name *
   - Category *
   - Type *
   - Manufacturer *
   - Model *
   - Company * (select from dropdown)
   - Project * (select from dropdown)
   - Company Code *
   - Either Serial Number OR Registration Number *
   - Purchase Date *
   - Purchase Value *
   - Currency *
   - Install Date *
   - End of Life Date *
   - Index Type *
   - Status *
4. Fill in optional fields as needed
5. Click "Create Asset"
6. Verify the asset is created successfully

### Test Asset Listing

1. Go to Asset Registry page
2. Verify existing assets still display correctly
3. Verify new assets appear in the list

---

## Troubleshooting

### Migration Fails

**Error: "column already exists"**
- The migration might have already run
- Check migration status: `pnpm prisma migrate status` (in container or on EC2)
- If migration already applied, skip to Step 5

**Error: "relation does not exist"**
- Make sure you're connected to the correct database
- Verify DATABASE_URL is correct in your Docker environment variables

**Error: "permission denied"**
- Check database user permissions
- Ensure user has CREATE, ALTER, and INDEX privileges

**Error: "connection refused" or "timeout"**
- Verify RDS security group allows connections from EC2
- Check DATABASE_URL is correct
- Verify RDS instance is running

### Docker Issues

**Error: "Container won't start"**
- Check Docker logs: `docker-compose logs backend` or `docker logs your-container-name`
- Verify all environment variables are set correctly
- Check if port 3000 is already in use: `sudo lsof -i :3000`

**Error: "Build failed"**
- Check Docker build logs
- Verify all dependencies are in `package.json`
- Check disk space: `df -h`
- Clear Docker cache: `docker system prune -a`

**Error: "Cannot connect to database"**
- Verify DATABASE_URL in docker-compose.yml or environment variables
- Check RDS security group allows EC2 IP
- Test connection from EC2: `psql "your-database-url"`

### Redis Issues

**Error: "Cannot connect to Redis"**
- Verify Redis URL/host in environment variables
- Check Redis is running: `docker-compose ps redis` or `docker ps | grep redis`
- Test Redis connection: `redis-cli -h your-redis-host ping`

### Frontend Issues

**Old form still showing**
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- If using CloudFront, verify cache invalidation completed
- If using Nginx, verify files were copied correctly

**API errors**
- Verify VITE_API_URL is correct in frontend build
- Check browser console for errors
- Verify backend is deployed and healthy
- Check CORS settings if accessing from different domain

---

## Rollback Instructions (If Needed)

If you need to rollback:

### Rollback Database

```bash
# Connect to database
psql "postgresql://username:password@your-rds-endpoint:5432/dbname"

# Revert the migration (manual SQL)
-- Note: This will lose data in new columns
ALTER TABLE "assets" RENAME COLUMN "asset_name" TO "name";
-- Remove new columns (be careful - this deletes data!)
ALTER TABLE "assets" DROP COLUMN IF EXISTS "type";
ALTER TABLE "assets" DROP COLUMN IF EXISTS "family";
-- ... etc (see migration file for all columns to remove)
```

### Rollback Backend

```bash
# Revert to previous commit
git checkout HEAD~1

# Rebuild and restart
docker-compose build backend
docker-compose up -d backend
```

Or if you have a previous Docker image:

```bash
# Tag and use previous image
docker tag your-backend-image:previous-tag your-backend-image:latest
docker-compose up -d backend
```

### Rollback Frontend

```bash
# Revert to previous commit
git checkout HEAD~1

# Rebuild and redeploy frontend
cd frontend
pnpm build
# Then deploy as per Step 7
```

---

## Quick Command Summary

```bash
# 1. SSH into EC2
ssh -i /path/to/key.pem ec2-user@your-ec2-ip

# 2. Navigate and pull code
cd /path/to/app
git pull origin main

# 3. Run migration (choose one method)
docker-compose exec backend pnpm prisma migrate deploy
# OR
cd backend && pnpm prisma migrate deploy

# 4. Rebuild and restart backend
docker-compose build backend
docker-compose up -d backend

# 5. Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL

# 6. Rebuild frontend (if on EC2)
docker-compose build frontend
docker-compose up -d frontend

# 7. Check logs
docker-compose logs -f backend

# 8. Verify health
curl http://localhost:3000/api/v1/health
```

---

## Environment Variables Checklist

Make sure these are set in your Docker environment:

**Backend:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` or `REDIS_HOST` - Redis connection
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - JWT refresh secret
- `NODE_ENV=production`
- `PORT=3000` (or your port)

**Frontend (if building on EC2):**
- `VITE_API_URL` - Backend API URL

---

## Support

If you encounter issues:
1. Check Docker logs: `docker-compose logs backend` or `docker logs container-name`
2. Check EC2 system logs: `sudo journalctl -u docker` or `sudo journalctl -xe`
3. Verify database connection from EC2
4. Verify Redis connection
5. Review the migration SQL file for any issues
6. Check RDS security groups allow EC2 access

---

## Next Steps

After successful deployment:
- ✅ Test creating a new asset with all fields
- ✅ Verify existing assets still work
- ✅ Monitor Docker container health
- ✅ Check application logs regularly
- ✅ Update any documentation or training materials
- ✅ Monitor for any errors in production

---

## Additional Docker Commands Reference

```bash
# View running containers
docker-compose ps
# OR
docker ps

# View logs
docker-compose logs -f [service-name]
# OR
docker logs -f [container-name]

# Restart a service
docker-compose restart [service-name]
# OR
docker restart [container-name]

# Stop all services
docker-compose down

# Start all services
docker-compose up -d

# Rebuild without cache
docker-compose build --no-cache [service-name]

# View container resource usage
docker stats

# Execute command in container
docker-compose exec [service-name] [command]
# OR
docker exec -it [container-name] [command]
```

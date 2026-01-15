# Railway Deployment Guide - Sales Quote System

## Step 1: Commit and Push Changes

```bash
cd /Users/josephhamze/Central-Hub

# Add all new files
git add .

# Commit changes
git commit -m "Add Sales Quote System: Complete backend and frontend implementation"

# Push to main branch (Railway will auto-deploy)
git push origin main
```

## Step 2: Railway Auto-Deployment

Railway will automatically:
1. Detect the push to main branch
2. Build the backend Docker image
3. Run migrations via `start.sh` (which calls `pnpm prisma migrate deploy`)
4. Start the backend service
5. Build and deploy the frontend

**Note**: The migration will run automatically, but you need to seed the database manually.

## Step 3: Seed the Database (Required)

After the backend is deployed, you need to run the seed script to add the new permissions.

### Option A: Via Railway CLI (Recommended)

```bash
# Install Railway CLI if you haven't
npm i -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Run the seed script
railway run --service backend pnpm prisma db seed
```

### Option B: Via Railway Dashboard

1. Go to your Railway project dashboard
2. Click on your **backend** service
3. Go to **Deployments** tab
4. Click on the latest deployment
5. Click **View Logs**
6. Click the **Shell** button (or use the terminal icon)
7. Run:
   ```bash
   pnpm prisma db seed
   ```

### Option C: Add to start.sh (Automatic)

If you want seeding to happen automatically on every deploy (only runs if needed due to upsert), you can modify `backend/start.sh`:

```bash
#!/bin/sh
set -e

# Run migrations
echo "Running database migrations..."
pnpm prisma migrate deploy

# Seed database (upsert, safe to run multiple times)
echo "Seeding database..."
pnpm prisma db seed

# Start the application
echo "Starting NestJS application..."
exec node dist/src/main.js
```

## Step 4: Verify Deployment

1. **Check Backend Health**:
   - Visit: `https://api.initiativehub.org/api/v1/health`
   - Should return: `{ "status": "ok" }`

2. **Check Swagger Docs**:
   - Visit: `https://api.initiativehub.org/api/docs`
   - You should see new endpoints for:
     - `/api/v1/companies`
     - `/api/v1/projects`
     - `/api/v1/customers`
     - `/api/v1/quotes`
     - etc.

3. **Check Frontend**:
   - Visit: `https://initiativehub.org`
   - Login with: `admin@example.com` / `Admin123!`
   - Navigate to "Sales Quotes" in sidebar
   - Try creating a quote at `/sales/quotes/new`

## Step 5: Verify Permissions

After seeding, verify the new permissions exist:

1. Login as admin
2. Go to Administration → Roles
3. Check that Administrator role has all new permissions:
   - `companies:*`
   - `customers:*`
   - `quotes:*`
   - etc.

## Troubleshooting

### Migration Fails

If migration fails, check Railway backend logs:
1. Go to Railway dashboard → Backend service → Deployments → Latest → Logs
2. Look for Prisma migration errors
3. Common issues:
   - Database connection issues (check `DATABASE_URL`)
   - Migration conflicts (may need to reset if in development)

### Seed Fails

If seed fails:
1. Check that migrations ran successfully first
2. Verify `DATABASE_URL` is correct
3. Check seed logs for specific errors
4. You can run seed multiple times (it uses upsert)

### Frontend Build Fails

If frontend build fails:
1. Check Railway frontend logs
2. Common issues:
   - Missing dependencies (check `package.json`)
   - TypeScript errors (check build logs)
   - Import path errors

### Backend Won't Start

If backend won't start:
1. Check Railway backend logs
2. Verify:
   - `DATABASE_URL` is set
   - `JWT_SECRET` is set
   - `CORS_ORIGIN` is set (should be `https://initiativehub.org`)
3. Check that `dist/src/main.js` exists (build completed)

## Environment Variables

Make sure these are set in Railway:

**Backend Service**:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `CORS_ORIGIN` - Should be `https://initiativehub.org`
- `NODE_ENV` - `production`

**Frontend Service**:
- `VITE_API_URL` - Should be `https://api.initiativehub.org/api/v1`

## Quick Checklist

- [ ] Committed and pushed all changes
- [ ] Railway detected the push and started building
- [ ] Backend build completed successfully
- [ ] Migration ran automatically (check logs)
- [ ] Database seeded with new permissions (run manually)
- [ ] Backend health check passes
- [ ] Frontend deployed successfully
- [ ] Can login and see "Sales Quotes" in sidebar
- [ ] Can access `/sales/quotes/new` page

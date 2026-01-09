# AWS Migration Guide - Step by Step

This guide will walk you through migrating your application from Railway to AWS.

## Prerequisites

- AWS Account with billing enabled
- AWS CLI installed and configured (`aws configure`)
- Access to Railway dashboard (for database export)
- Domain DNS access (for Route 53 or external DNS)

---

## Phase 1: Setup RDS PostgreSQL Database (Day 1)

### Step 1.1: Create RDS PostgreSQL Instance

**Via AWS Console:**
1. Go to AWS Console → RDS → Databases
2. Click "Create database"
3. Choose:
   - **Engine**: PostgreSQL
   - **Version**: PostgreSQL 16
   - **Template**: Free tier (or Production if needed)
   - **DB instance identifier**: `ocp-postgres`
   - **Master username**: `ocp_admin` (or your choice)
   - **Master password**: Create a strong password (save it!)
   - **DB instance class**: `db.t3.micro` (free tier) or `db.t3.small` (production)
   - **Storage**: 20 GB (gp3)
   - **VPC**: Default VPC (or create new)
   - **Public access**: Yes (for App Runner to connect)
   - **Security group**: Create new (we'll configure it)
4. Click "Create database"
5. Wait 5-10 minutes for creation

**Via AWS CLI:**
```bash
aws rds create-db-instance \
  --db-instance-identifier ocp-postgres \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.1 \
  --master-username ocp_admin \
  --master-user-password 'YOUR_SECURE_PASSWORD' \
  --allocated-storage 20 \
  --storage-type gp3 \
  --publicly-accessible \
  --backup-retention-period 7 \
  --no-multi-az
```

### Step 1.2: Configure Security Group

1. Go to RDS → Your database → Connectivity & security
2. Click on the Security group
3. Click "Edit inbound rules"
4. Add rule:
   - **Type**: PostgreSQL
   - **Port**: 5432
   - **Source**: Custom (0.0.0.0/0) - or restrict to App Runner IPs later
5. Save rules

### Step 1.3: Get Database Connection String

1. Go to RDS → Your database → Connectivity & security
2. Copy the **Endpoint** (e.g., `ocp-postgres.xxxxx.us-east-1.rds.amazonaws.com`)
3. Connection string format:
   ```
   postgresql://ocp_admin:YOUR_PASSWORD@ocp-postgres.xxxxx.us-east-1.rds.amazonaws.com:5432/postgres?schema=public
   ```

### Step 1.4: Export Data from Railway

```bash
# Get Railway database URL from Railway dashboard
# Then export:
pg_dump $RAILWAY_DATABASE_URL > railway_backup.sql

# Or if you have Railway CLI:
railway connect postgres
pg_dump > railway_backup.sql
```

### Step 1.5: Import Data to RDS

```bash
# Import to RDS
psql "postgresql://ocp_admin:YOUR_PASSWORD@ocp-postgres.xxxxx.us-east-1.rds.amazonaws.com:5432/postgres" < railway_backup.sql
```

---

## Phase 2: Setup AWS Secrets Manager (Day 1)

### Step 2.1: Create Secrets

**Via AWS Console:**
1. Go to AWS Secrets Manager
2. Click "Store a new secret"
3. Create these secrets:

**Secret 1: Database URL**
- Secret type: Other type of secret
- Key/value:
  - Key: `DATABASE_URL`
  - Value: `postgresql://ocp_admin:PASSWORD@ocp-postgres.xxxxx.us-east-1.rds.amazonaws.com:5432/postgres?schema=public`
- Secret name: `ocp-database-url`
- Click "Store"

**Secret 2: JWT Secret**
- Secret type: Other type of secret
- Key/value:
  - Key: `JWT_SECRET`
  - Value: `your-jwt-secret-here` (use a strong random string)
- Secret name: `ocp-jwt-secret`
- Click "Store"

**Secret 3: JWT Refresh Secret**
- Secret type: Other type of secret
- Key/value:
  - Key: `JWT_REFRESH_SECRET`
  - Value: `your-jwt-refresh-secret-here` (use a strong random string)
- Secret name: `ocp-jwt-refresh-secret`
- Click "Store"

**Via AWS CLI:**
```bash
# Database URL
aws secretsmanager create-secret \
  --name ocp-database-url \
  --secret-string '{"DATABASE_URL":"postgresql://ocp_admin:PASSWORD@ocp-postgres.xxxxx.us-east-1.rds.amazonaws.com:5432/postgres?schema=public"}'

# JWT Secret
aws secretsmanager create-secret \
  --name ocp-jwt-secret \
  --secret-string '{"JWT_SECRET":"your-jwt-secret-here"}'

# JWT Refresh Secret
aws secretsmanager create-secret \
  --name ocp-jwt-refresh-secret \
  --secret-string '{"JWT_REFRESH_SECRET":"your-jwt-refresh-secret-here"}'
```

### Step 2.2: Get Secret ARNs

1. Go to each secret in Secrets Manager
2. Copy the **ARN** (e.g., `arn:aws:secretsmanager:us-east-1:123456789:secret:ocp-database-url-xxxxx`)
3. Update `backend/apprunner.yaml` with these ARNs (replace `REGION` and `ACCOUNT_ID`)

---

## Phase 3: Setup AWS App Runner for Backend (Day 2)

### Step 3.1: Update apprunner.yaml

1. Open `backend/apprunner.yaml`
2. Replace `REGION` with your AWS region (e.g., `us-east-1`)
3. Replace `ACCOUNT_ID` with your AWS account ID
4. Get your account ID:
   ```bash
   aws sts get-caller-identity --query Account --output text
   ```

### Step 3.2: Create App Runner Service

**Via AWS Console:**
1. Go to AWS App Runner
2. Click "Create service"
3. Choose "Source code repository"
4. Connect to GitHub:
   - Click "Add new"
   - Authorize AWS App Runner
   - Select your repository
   - Branch: `main`
   - Deployment trigger: Automatic
5. Configure build:
   - Build type: Use a configuration file
   - Configuration file: `backend/apprunner.yaml`
6. Configure service:
   - Service name: `ocp-backend`
   - Virtual CPU: 1 vCPU
   - Memory: 2 GB
   - Port: 3000
   - Environment variables: (already in apprunner.yaml)
7. Click "Create & deploy"
8. Wait 5-10 minutes for first deployment

### Step 3.3: Get App Runner Service URL

1. Go to App Runner → Your service
2. Copy the **Service URL** (e.g., `https://xxxxx.us-east-1.awsapprunner.com`)
3. This will be your backend API URL

### Step 3.4: Test Backend

```bash
# Health check
curl https://YOUR_APP_RUNNER_URL/api/v1/health

# Should return: {"status":"ok"}
```

---

## Phase 4: Setup S3 + CloudFront for Frontend (Day 3)

### Step 4.1: Create S3 Bucket

**Via AWS Console:**
1. Go to S3 → Create bucket
2. Bucket name: `ocp-frontend` (must be globally unique)
3. Region: Same as your backend
4. Block Public Access: Uncheck "Block all public access" (we'll use CloudFront)
5. Click "Create bucket"

**Via AWS CLI:**
```bash
aws s3 mb s3://ocp-frontend --region us-east-1
```

### Step 4.2: Request SSL Certificate

1. Go to AWS Certificate Manager (ACM)
2. Request certificate
3. Domain name: `initiativehub.org`
4. Additional names: `*.initiativehub.org` (for subdomains)
5. Validation: DNS validation
6. Click "Request"
7. Follow DNS validation instructions (add CNAME records to your domain)

### Step 4.3: Create CloudFront Distribution

1. Go to CloudFront → Create distribution
2. Origin:
   - Origin domain: Select your S3 bucket (`ocp-frontend.s3.us-east-1.amazonaws.com`)
   - Origin access: Origin access control settings (recommended)
3. Default cache behavior:
   - Viewer protocol policy: Redirect HTTP to HTTPS
   - Allowed HTTP methods: GET, HEAD, OPTIONS
   - Cache policy: CachingOptimized
4. Settings:
   - Alternate domain names (CNAMEs): `initiativehub.org`, `www.initiativehub.org`
   - SSL certificate: Select your ACM certificate
   - Default root object: `index.html`
   - Custom error responses:
     - 403 → 200 → `/index.html` (for React Router)
     - 404 → 200 → `/index.html`
5. Click "Create distribution"
6. Wait 10-15 minutes for deployment

### Step 4.4: Build and Upload Frontend

```bash
cd frontend

# Build with new API URL
VITE_API_URL=https://YOUR_APP_RUNNER_URL/api/v1 pnpm build

# Upload to S3
aws s3 sync dist/ s3://ocp-frontend/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

---

## Phase 5: Setup DNS (Day 4)

### Step 5.1: Update DNS Records

**For Frontend (initiativehub.org):**
- Type: CNAME
- Name: @ (or leave blank)
- Value: Your CloudFront distribution domain (e.g., `d1234567890.cloudfront.net`)

**For Backend API (api.initiativehub.org):**
- Type: CNAME
- Name: api
- Value: Your App Runner service URL (e.g., `xxxxx.us-east-1.awsapprunner.com`)

**Wait for DNS propagation** (can take up to 48 hours, usually 1-2 hours)

---

## Cost Estimate

**Monthly Costs (Approximate):**
- RDS PostgreSQL (db.t3.micro): ~$15-25/month
- App Runner (1 vCPU, 2GB): ~$25-60/month
- S3 Storage: ~$0.50/month
- CloudFront: ~$1-5/month
- Secrets Manager: ~$0.40/month
- **Total: ~$42-91/month**

---

## Next Steps

1. Set up GitHub Actions for auto-deployment (see `.github/workflows/` files)
2. Configure automated backups for RDS
3. Set up staging environment
4. Configure custom domain for App Runner (if needed)

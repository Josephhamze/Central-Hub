# AWS Migration - Quick Start

## Files Created

✅ **`backend/apprunner.yaml`** - App Runner configuration
✅ **`AWS_MIGRATION_GUIDE.md`** - Complete step-by-step guide
✅ **`scripts/migrate-database.sh`** - Database migration script
✅ **`.github/workflows/deploy-backend.yml`** - Backend auto-deploy
✅ **`.github/workflows/deploy-frontend.yml`** - Frontend auto-deploy

## Quick Start Checklist

### 1. Prerequisites (5 minutes)
- [ ] AWS Account created
- [ ] AWS CLI installed (`brew install awscli` or download)
- [ ] AWS CLI configured (`aws configure`)
- [ ] Get your AWS Account ID: `aws sts get-caller-identity --query Account --output text`

### 2. Database Setup (30 minutes)
- [ ] Create RDS PostgreSQL instance (see Phase 1 in guide)
- [ ] Export data from Railway: `./scripts/migrate-database.sh`
- [ ] Import to RDS (script will do this)

### 3. Secrets Setup (10 minutes)
- [ ] Create secrets in AWS Secrets Manager:
  - `ocp-database-url`
  - `ocp-jwt-secret`
  - `ocp-jwt-refresh-secret`
- [ ] Get secret ARNs
- [ ] Update `backend/apprunner.yaml` with ARNs (replace REGION and ACCOUNT_ID)

### 4. Backend Deployment (20 minutes)
- [ ] Create App Runner service (connect to GitHub)
- [ ] Wait for first deployment
- [ ] Test: `curl https://YOUR_URL/api/v1/health`

### 5. Frontend Deployment (30 minutes)
- [ ] Create S3 bucket: `ocp-frontend`
- [ ] Request SSL certificate in ACM
- [ ] Create CloudFront distribution
- [ ] Build and upload: See Phase 4 in guide

### 6. DNS Setup (5 minutes + wait for propagation)
- [ ] Point `initiativehub.org` → CloudFront
- [ ] Point `api.initiativehub.org` → App Runner

### 7. GitHub Actions (5 minutes)
- [ ] Add secrets to GitHub:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_REGION`
  - `VITE_API_URL`
  - `CLOUDFRONT_DISTRIBUTION_ID`

## Estimated Time: 2-3 hours total

## Need Help?

See `AWS_MIGRATION_GUIDE.md` for detailed instructions for each step.

## Cost Estimate

~$42-91/month (similar to Railway)

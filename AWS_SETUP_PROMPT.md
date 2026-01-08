# AWS Setup Prompt for ChatGPT Agent

Copy and paste this entire prompt to ChatGPT:

---

## Task: Set Up AWS Infrastructure for NestJS + React Application Migration

I need to migrate my full-stack application from Railway to AWS. Please help me set up the complete AWS infrastructure with step-by-step instructions and all necessary configuration files.

### Application Overview

**Current Stack:**
- **Backend**: NestJS (Node.js 20) with TypeScript, Prisma ORM, PostgreSQL
- **Frontend**: React + Vite (static site, served via Nginx)
- **Database**: PostgreSQL 16
- **Current Hosting**: Railway (auto-deploys from GitHub)

**Repository Structure:**
```
/
├── backend/
│   ├── src/           # NestJS source code
│   ├── prisma/        # Prisma schema and migrations
│   ├── package.json   # Uses pnpm
│   └── Dockerfile     # Already exists
├── frontend/
│   ├── src/           # React source code
│   ├── package.json   # Uses pnpm
│   └── Dockerfile     # Already exists (Nginx-based)
└── docker-compose.yml # Local development
```

**Key Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - JWT refresh token secret
- `CORS_ORIGIN` - Allowed CORS origins (comma-separated)
- `NODE_ENV` - production
- `PORT` - Backend port (default: 3000)
- `VITE_API_URL` - Frontend API URL (build-time variable)

**Backend Start Process:**
1. Run Prisma migrations: `pnpm prisma migrate deploy`
2. Start NestJS: `node dist/src/main.js`

**Frontend Build Process:**
1. Build: `pnpm build` (outputs to `dist/`)
2. Serve static files via Nginx

**Domain Setup:**
- Frontend: `initiativehub.org` (currently on Railway)
- Backend API: `api.initiativehub.org` (currently on Railway)

---

## Your Tasks

### Task 1: Create AWS App Runner Configuration for Backend

Create an `apprunner.yaml` configuration file for the backend service that:
- Uses Node.js 20 runtime
- Builds from the `backend/` directory
- Runs `pnpm install` and `pnpm build` during build
- Runs migrations (`pnpm prisma migrate deploy`) before starting
- Starts the app with `node dist/src/main.js`
- Connects to environment variables from AWS Secrets Manager
- Exposes port 3000

Also provide:
- Step-by-step instructions to create the App Runner service via AWS Console
- How to connect it to GitHub for auto-deployment
- How to configure environment variables in Secrets Manager

### Task 2: Create S3 + CloudFront Setup for Frontend

Provide instructions and configuration for:
- Creating an S3 bucket for static hosting
- Setting up CloudFront distribution
- Configuring SSL certificate via ACM (Certificate Manager)
- Setting up custom domain (`initiativehub.org`)
- Creating a GitHub Actions workflow to auto-deploy frontend on push to main branch
- The workflow should:
  - Build frontend with `VITE_API_URL` environment variable
  - Upload `dist/` folder to S3
  - Invalidate CloudFront cache

### Task 3: Create RDS PostgreSQL Setup

Provide:
- Step-by-step instructions to create RDS PostgreSQL 16 instance
- Recommended instance type (db.t3.micro for development, db.t3.small for production)
- Security group configuration (allow App Runner/ECS to connect)
- How to export data from Railway PostgreSQL
- How to import data to RDS
- Connection string format for Prisma

### Task 4: Create AWS Secrets Manager Setup

Provide:
- List of all secrets that need to be created
- Step-by-step instructions to create each secret
- How to reference secrets in App Runner configuration
- Best practices for secret rotation

### Task 5: Create Migration Scripts

Create scripts for:
- **Database Migration Script**: Export from Railway PostgreSQL and import to RDS
- **Environment Variable Migration**: Document all env vars and their new locations
- **DNS Migration Guide**: How to update DNS records from Railway to AWS

### Task 6: Create Monitoring & Alarms Setup

Provide:
- CloudWatch setup for App Runner logs
- CloudWatch alarms for:
  - Backend health check failures
  - Database connection issues
  - High error rates
- SNS notifications for alerts

### Task 7: Create Cost Optimization Guide

Provide:
- Estimated monthly costs breakdown
- How to set up billing alerts
- Cost optimization tips (reserved instances, etc.)
- Free tier usage recommendations

### Task 8: Create Complete Deployment Checklist

Create a comprehensive checklist with:
- Pre-migration tasks
- Infrastructure setup steps
- Deployment steps
- Testing steps
- Post-migration verification
- Rollback procedures

### Task 9: Create GitHub Actions Workflows

Create complete GitHub Actions workflow files for:
- **Backend Auto-Deploy**: Trigger on push to main, build and deploy to App Runner
- **Frontend Auto-Deploy**: Trigger on push to main, build and deploy to S3+CloudFront
- Include proper secrets management
- Include error handling and notifications

### Task 10: Create Troubleshooting Guide

Create a guide covering:
- Common deployment issues
- Database connection problems
- CORS issues
- SSL certificate problems
- DNS propagation issues
- How to view logs in CloudWatch
- How to rollback deployments

---

## Requirements

1. **All instructions must be step-by-step** - Assume I'm new to AWS
2. **Include all configuration files** - Don't just describe, provide actual YAML/JSON/config files
3. **Include AWS CLI commands** - For users who prefer CLI over Console
4. **Include cost estimates** - For each service
5. **Include security best practices** - IAM roles, least privilege, etc.
6. **Include backup strategies** - For RDS and application data
7. **Make it production-ready** - Not just a dev setup

---

## Deliverables

Please provide:

1. ✅ Complete `apprunner.yaml` configuration file
2. ✅ Step-by-step AWS Console setup guide (with screenshots descriptions)
3. ✅ AWS CLI commands alternative
4. ✅ GitHub Actions workflow files (`.github/workflows/`)
5. ✅ Database migration scripts
6. ✅ Environment variable migration guide
7. ✅ DNS setup instructions
8. ✅ Monitoring and alerting configuration
9. ✅ Complete deployment checklist
10. ✅ Troubleshooting guide
11. ✅ Cost breakdown and optimization tips
12. ✅ Security best practices checklist

---

## Additional Context

- **GitHub Repository**: Connected to main branch
- **Current Railway Setup**: Auto-deploys on push to main
- **Database**: Has existing data that needs to be migrated
- **Domain**: Already registered, DNS managed externally (or can use Route 53)
- **Budget**: Looking for cost-effective solution (~$50-150/month)
- **Traffic**: Low to moderate (not high-scale yet)

---

## Priority

Please prioritize:
1. **App Runner setup** (backend) - Most critical
2. **RDS setup** (database) - Critical for data migration
3. **S3+CloudFront** (frontend) - Important but can be done after backend
4. **Monitoring** - Important for production
5. **CI/CD** - Nice to have but can be manual initially

Start with Task 1 and work through them systematically. Provide all files and configurations ready to use.

---

**Please begin with Task 1: AWS App Runner Configuration for Backend**

# AWS EC2 Deployment - Quick Start

## Files Created

✅ **`backend/apprunner.yaml`** - App Runner configuration (optional)
✅ **`docker-compose.yml`** - Docker Compose for EC2 deployment
✅ **`AWS_MIGRATION_GUIDE.md`** - Complete step-by-step guide

## Quick Start Checklist

### 1. Prerequisites (5 minutes)
- [ ] AWS Account created
- [ ] AWS CLI installed (`brew install awscli` or download)
- [ ] AWS CLI configured (`aws configure`)
- [ ] Get your AWS Account ID: `aws sts get-caller-identity --query Account --output text`

### 2. EC2 Instance Setup (20 minutes)
- [ ] Launch EC2 instance (t3.medium or larger recommended)
- [ ] Configure security groups (ports 80, 443, 22)
- [ ] Install Docker and Docker Compose
- [ ] Clone repository to EC2

### 3. Database Setup (15 minutes)
- [ ] PostgreSQL 15.5 via Docker Compose (included)
- [ ] Or use RDS PostgreSQL 15.5 for production
- [ ] Run migrations: `docker-compose exec backend pnpm prisma migrate deploy`

### 4. Redis Setup (included in Docker Compose)
- [ ] Redis 7 runs automatically with Docker Compose
- [ ] Configure `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

### 5. Deploy with Docker Compose (10 minutes)
```bash
# Copy environment file
cp .env.example .env
# Update with production values

# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

### 6. DNS Setup (5 minutes + wait for propagation)
- [ ] Point `alphapms.app` → EC2 public IP (or Load Balancer)
- [ ] Point `api.alphapms.app` → EC2 public IP (or Load Balancer)
- [ ] Configure SSL with Let's Encrypt or AWS ACM

### 7. Verify Deployment
```bash
# Test health endpoint
curl https://api.alphapms.app/api/v1/health

# Test frontend
curl https://alphapms.app
```

## Estimated Time: 1-2 hours total

## Need Help?

See `AWS_MIGRATION_GUIDE.md` for detailed instructions for each step.

## Cost Estimate

~$30-80/month depending on EC2 instance size

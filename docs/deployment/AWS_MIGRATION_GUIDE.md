# AWS EC2 Deployment Guide - Step by Step

This guide will walk you through deploying your application to AWS EC2 with Docker Compose.

## Prerequisites

- AWS Account with billing enabled
- AWS CLI installed and configured (`aws configure`)
- Domain DNS access (for Route 53 or external DNS)
- SSH key pair for EC2 access

---

## Phase 1: Setup EC2 Instance

### Step 1.1: Launch EC2 Instance

**Via AWS Console:**
1. Go to AWS Console → EC2 → Launch Instance
2. Choose:
   - **Name**: `alphapms-server`
   - **AMI**: Amazon Linux 2023 or Ubuntu 22.04
   - **Instance type**: `t3.medium` (or larger for production)
   - **Key pair**: Create or select existing
   - **Network settings**:
     - Allow SSH (port 22)
     - Allow HTTP (port 80)
     - Allow HTTPS (port 443)
   - **Storage**: 30 GB gp3
3. Click "Launch instance"

### Step 1.2: Connect to EC2 Instance

```bash
# Connect via SSH
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP

# Or for Ubuntu
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### Step 1.3: Install Docker and Docker Compose

```bash
# For Amazon Linux 2023
sudo yum update -y
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

---

## Phase 2: Deploy Application

### Step 2.1: Clone Repository

```bash
cd ~
git clone https://github.com/your-org/your-repo.git app
cd app
```

### Step 2.2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with production values
nano .env
```

Update these values in `.env`:
```env
# PostgreSQL
POSTGRES_USER=alphapms_user
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD
POSTGRES_DB=alphapms_database

# Redis
REDIS_PASSWORD=YOUR_SECURE_REDIS_PASSWORD

# JWT (use strong random strings)
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret

# Frontend API URL
VITE_API_URL=https://api.alphapms.app/api/v1
```

### Step 2.3: Start Services

```bash
# Build and start all services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
```

### Step 2.4: Run Database Migrations

```bash
# Run migrations
docker-compose exec backend pnpm prisma migrate deploy

# Seed database (optional, for initial data)
docker-compose exec backend pnpm prisma db seed
```

### Step 2.5: Test Deployment

```bash
# Test backend health
curl http://localhost:3000/api/v1/health

# Should return: {"status":"ok"}
```

---

## Phase 3: Setup SSL with Let's Encrypt

### Step 3.1: Install Certbot

```bash
# For Amazon Linux 2023
sudo yum install certbot python3-certbot-nginx -y
```

### Step 3.2: Configure Nginx as Reverse Proxy

Create `/etc/nginx/conf.d/alphapms.conf`:
```nginx
server {
    listen 80;
    server_name alphapms.app www.alphapms.app;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name api.alphapms.app;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Step 3.3: Obtain SSL Certificates

```bash
# Get certificates
sudo certbot --nginx -d alphapms.app -d www.alphapms.app -d api.alphapms.app

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## Phase 4: Setup DNS

### Step 4.1: Update DNS Records

**For Frontend (alphapms.app):**
- Type: A
- Name: @ (or leave blank)
- Value: Your EC2 public IP

**For WWW (www.alphapms.app):**
- Type: CNAME
- Name: www
- Value: alphapms.app

**For Backend API (api.alphapms.app):**
- Type: A
- Name: api
- Value: Your EC2 public IP

**Wait for DNS propagation** (can take up to 48 hours, usually 1-2 hours)

---

## Phase 5: Production Optimizations

### Step 5.1: Setup Elastic IP

1. Go to EC2 → Elastic IPs
2. Allocate new address
3. Associate with your instance
4. Update DNS records with Elastic IP

### Step 5.2: Configure Auto-Start on Boot

```bash
# Enable Docker to start on boot
sudo systemctl enable docker

# Create systemd service for docker-compose
sudo nano /etc/systemd/system/alphapms.service
```

Add:
```ini
[Unit]
Description=AlphaPMS Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ec2-user/app
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable alphapms
```

### Step 5.3: Setup Automated Backups

```bash
# Create backup script
nano ~/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U alphapms_user alphapms_database > ~/backups/db_$DATE.sql
# Upload to S3 (optional)
# aws s3 cp ~/backups/db_$DATE.sql s3://your-backup-bucket/
```

---

## Cost Estimate

**Monthly Costs (Approximate):**
- EC2 t3.medium: ~$30/month
- EBS Storage (30GB): ~$3/month
- Elastic IP: ~$4/month (if not attached to running instance)
- Data Transfer: ~$5-10/month
- **Total: ~$40-50/month**

---

## Troubleshooting

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Restart Services
```bash
docker-compose restart

# Or specific service
docker-compose restart backend
```

### Database Access
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U alphapms_user -d alphapms_database
```

---

## Next Steps

1. Set up monitoring (CloudWatch or external service)
2. Configure automated deployments with GitHub Actions
3. Set up staging environment
4. Configure RDS for managed database (optional)

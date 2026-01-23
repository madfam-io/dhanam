# Dhanam Ledger Deployment Guide

## Overview

This guide covers deploying Dhanam Ledger to production environments.

**Primary Deployment Method**: Enclii PaaS (auto-deploy on push to `main`)
**Fallback/Manual Method**: AWS ECS/Fargate with Terraform

## Enclii Deployment (Primary)

Dhanam uses **Enclii** (MADFAM's own PaaS) for all production deployments.

### How It Works

1. Push code to `main` branch
2. Enclii detects the change automatically
3. Enclii builds Docker images
4. Enclii deploys to bare metal Kubernetes cluster

### Configuration

Enclii configuration is defined in `.enclii.yml` at the project root.

### Production URLs

| Service | URL |
|---------|-----|
| Web Dashboard | `https://app.dhan.am` |
| Admin Dashboard | `https://admin.dhanam.com` |
| API Backend | `https://api.dhan.am` |

### Infrastructure

- **Cluster**: 2-Node Hetzner Cluster
- **Production Node**: "The Sanctuary" (AX41-NVMe)
- **Build Node**: "The Forge" (CPX11)
- **Ingress**: Cloudflare Tunnel (zero-trust)

### Manual Deployment via Enclii

```bash
# If auto-deploy is disabled or you need to force a deployment:
enclii deploy --app dhanam --env production
```

---

## AWS ECS/Fargate Deployment (Fallback)

The following section covers manual deployment to AWS ECS/Fargate, which serves as a fallback option when Enclii is unavailable.

## Architecture

### Production Infrastructure
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CloudFront    │    │   Application   │    │    Database     │
│   (CDN/WAF)     │───▶│   Load Balancer │───▶│   RDS/Redis     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   ECS Cluster   │
                       │                 │
                       │  ┌──────────────┤
                       │  │ API Tasks    │
                       │  └──────────────┤
                       │  ┌──────────────┤
                       │  │ Web Tasks    │
                       │  └──────────────┤
                       └─────────────────┘
```

### Components
- **CloudFront**: Global CDN and Web Application Firewall
- **Application Load Balancer**: Traffic distribution and SSL termination
- **ECS Fargate**: Containerized application hosting
- **RDS PostgreSQL**: Primary database with read replicas
- **ElastiCache Redis**: Session storage and job queues
- **S3**: File storage and static assets
- **KMS**: Encryption key management
- **Route53**: DNS management
- **CloudWatch**: Monitoring and logging

## Prerequisites

### Required Tools
```bash
# Terraform for infrastructure
brew install terraform

# AWS CLI for deployment
brew install awscli

# Docker for building images
brew install docker

# pnpm for package management
npm install -g pnpm
```

### AWS Account Setup
1. Create AWS account with appropriate permissions
2. Configure AWS CLI credentials
3. Create S3 bucket for Terraform state
4. Set up Route53 hosted zone for your domain

### Environment Variables
Create environment-specific configuration files:

```bash
# environments/production.tfvars
environment = "production"
domain_name = "dhanam.io"
api_domain  = "api.dhanam.io"
web_domain  = "app.dhanam.io"

# Database configuration
db_instance_class = "db.r5.large"
db_allocated_storage = 100
db_multi_az = true

# Application configuration
api_cpu = 1024
api_memory = 2048
web_cpu = 512
web_memory = 1024

# Scaling configuration
api_min_capacity = 2
api_max_capacity = 10
web_min_capacity = 2
web_max_capacity = 5
```

## Infrastructure Setup

### 1. Initialize Terraform

```bash
cd infra/terraform

# Initialize Terraform backend
terraform init -backend-config="bucket=dhanam-terraform-state" \
               -backend-config="key=production/terraform.tfstate" \
               -backend-config="region=us-east-1"
```

### 2. Plan Infrastructure Changes

```bash
# Review infrastructure changes
terraform plan -var-file="environments/production.tfvars"

# Save plan for review
terraform plan -var-file="environments/production.tfvars" -out=production.tfplan
```

### 3. Apply Infrastructure

```bash
# Apply infrastructure changes
terraform apply production.tfplan

# Or apply directly (with approval)
terraform apply -var-file="environments/production.tfvars"
```

### 4. Infrastructure Outputs

After successful deployment, Terraform outputs important values:

```bash
# Get infrastructure outputs
terraform output

# Example outputs:
# api_url = "https://api.dhanam.io"
# web_url = "https://app.dhanam.io"
# database_endpoint = "dhanam-prod.cluster-abc123.us-east-1.rds.amazonaws.com"
# redis_endpoint = "dhanam-prod-redis.abc123.cache.amazonaws.com"
```

## Application Deployment

### 1. Build Docker Images

```bash
# Build API image
docker build -f infra/docker/Dockerfile.api -t dhanam-api:latest .

# Build Web image
docker build -f infra/docker/Dockerfile.web -t dhanam-web:latest .

# Tag images for ECR
docker tag dhanam-api:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/dhanam-api:latest
docker tag dhanam-web:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/dhanam-web:latest
```

### 2. Push to ECR

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Push images
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/dhanam-api:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/dhanam-web:latest
```

### 3. Deploy to ECS

```bash
# Update ECS service with new image
aws ecs update-service \
    --cluster dhanam-production \
    --service dhanam-api \
    --force-new-deployment

aws ecs update-service \
    --cluster dhanam-production \
    --service dhanam-web \
    --force-new-deployment
```

## Database Setup

### 1. Database Migration

```bash
# Connect to production database through bastion host
ssh -i ~/.ssh/dhanam-production.pem ec2-user@bastion.dhanam.io

# Run database migrations
export DATABASE_URL="postgresql://username:password@database-endpoint:5432/dhanam"
pnpm db:migrate

# Verify migrations
pnpm db:status
```

### 2. Seed Production Data

```bash
# Create initial admin user and demo data
pnpm db:seed:production

# This creates:
# - Admin user with TOTP 2FA enabled
# - System categories and rules
# - Default space configurations
```

## Environment Configuration

### 1. API Environment Variables

Set these in ECS task definition or AWS Parameter Store:

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dhanam"
DATABASE_POOL_SIZE="20"

# Redis
REDIS_URL="redis://redis-cluster:6379"
REDIS_DB="0"

# Authentication
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="30d"

# Encryption
ENCRYPTION_KEY="arn:aws:kms:us-east-1:123456789012:key/abcd-1234"

# Provider APIs
PLAID_CLIENT_ID="your-plaid-client-id"
PLAID_SECRET="your-plaid-secret"
PLAID_ENV="production"

BELVO_SECRET_ID="your-belvo-secret-id"
BELVO_SECRET_PASSWORD="your-belvo-password"
BELVO_ENV="production"

BITSO_API_KEY="your-bitso-api-key"
BITSO_API_SECRET="your-bitso-api-secret"

# External APIs
BANXICO_API_TOKEN="your-banxico-token"
EXCHANGERATE_API_KEY="your-exchangerate-key"

# Monitoring
POSTHOG_API_KEY="your-posthog-key"
SENTRY_DSN="your-sentry-dsn"

# Email
SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
SMTP_PORT="587"
SMTP_USER="your-ses-user"
SMTP_PASS="your-ses-password"

# AWS
AWS_REGION="us-east-1"
AWS_S3_BUCKET="dhanam-production-assets"
```

### 2. Web Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL="https://api.dhanam.io"
NEXT_PUBLIC_WEB_URL="https://app.dhanam.io"

# Analytics
NEXT_PUBLIC_POSTHOG_KEY="your-posthog-public-key"
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS="true"
NEXT_PUBLIC_ENABLE_2FA="true"
NEXT_PUBLIC_ENABLE_ESG="true"

# Localization
NEXT_PUBLIC_DEFAULT_LOCALE="en"
NEXT_PUBLIC_SUPPORTED_LOCALES="en,es"
```

## SSL/TLS Configuration

### 1. Certificate Management

SSL certificates are automatically managed by AWS Certificate Manager:

```bash
# Request certificate
aws acm request-certificate \
    --domain-name "*.dhanam.io" \
    --validation-method DNS \
    --subject-alternative-names "dhanam.io"
```

### 2. DNS Validation

Add CNAME records provided by ACM to Route53:

```bash
# Validate certificate
aws acm describe-certificate --certificate-arn "arn:aws:acm:us-east-1:123456789012:certificate/abcd-1234"
```

## Monitoring and Logging

### 1. CloudWatch Setup

Monitor application metrics:

```bash
# API Metrics
- dhanam/api/requests_per_second
- dhanam/api/response_time
- dhanam/api/error_rate
- dhanam/api/database_connections

# Web Metrics  
- dhanam/web/page_views
- dhanam/web/bounce_rate
- dhanam/web/load_time
```

### 2. Log Configuration

Centralized logging with CloudWatch Logs:

```json
{
  "logConfiguration": {
    "logDriver": "awslogs",
    "options": {
      "awslogs-group": "/aws/ecs/dhanam-production",
      "awslogs-region": "us-east-1",
      "awslogs-stream-prefix": "ecs"
    }
  }
}
```

### 3. Alerting

Set up CloudWatch alarms:

```bash
# High error rate alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "dhanam-api-high-error-rate" \
    --alarm-description "API error rate above 5%" \
    --metric-name "HTTPCode_Target_5XX_Count" \
    --namespace "AWS/ApplicationELB" \
    --statistic Sum \
    --period 300 \
    --threshold 5 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2

# High response time alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "dhanam-api-high-response-time" \
    --alarm-description "API response time above 2 seconds" \
    --metric-name "TargetResponseTime" \
    --namespace "AWS/ApplicationELB" \
    --statistic Average \
    --period 300 \
    --threshold 2 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 3
```

## Security Hardening

### 1. WAF Configuration

Configure AWS WAF rules:

```bash
# Block common attacks
- SQL injection protection
- XSS protection  
- Rate limiting (100 requests per 5 minutes)
- Geographic restrictions
- Known malicious IPs
```

### 2. Security Groups

Restrict network access:

```bash
# API Security Group
- Port 443: ALB only
- Port 80: ALB only (redirect to HTTPS)
- Internal communication: VPC only

# Database Security Group
- Port 5432: API services only
- No public access
```

### 3. IAM Policies

Principle of least privilege:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": "arn:aws:kms:us-east-1:123456789012:key/abcd-1234"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::dhanam-production-assets/*"
    }
  ]
}
```

## Backup and Recovery

### 1. Database Backups

Automated RDS backups:

```bash
# Automated backup configuration
- Backup retention period: 30 days
- Backup window: 03:00-04:00 UTC
- Point-in-time recovery enabled
- Cross-region backup replication
```

### 2. Disaster Recovery

Multi-region setup for disaster recovery:

```bash
# Primary region: us-east-1
# DR region: us-west-2
# RTO: 4 hours
# RPO: 1 hour
```

## Performance Optimization

### 1. CDN Configuration

CloudFront optimization:

```bash
# Caching strategy
- Static assets: 1 year cache
- API responses: No cache
- HTML pages: 1 hour cache
- Gzip compression enabled
- HTTP/2 support
```

### 2. Database Optimization

PostgreSQL performance tuning:

```sql
-- Connection pooling
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB

-- Read replicas for reporting
- Primary: Write operations
- Read replica 1: Dashboard queries
- Read replica 2: Analytics queries
```

### 3. Application Optimization

ECS task optimization:

```bash
# API Service
- CPU: 1024 (1 vCPU)
- Memory: 2048MB
- Min tasks: 2
- Max tasks: 10
- Target CPU: 70%

# Web Service
- CPU: 512 (0.5 vCPU) 
- Memory: 1024MB
- Min tasks: 2
- Max tasks: 5
- Target CPU: 70%
```

## Mobile App Deployment

### 1. iOS App Store

Deploy to Apple App Store:

```bash
# Build for App Store
cd apps/mobile
pnpm build:ios:production

# Submit via EAS
eas submit --platform ios --path=./ios/build/Dhanam.ipa
```

### 2. Google Play Store

Deploy to Google Play:

```bash
# Build for Play Store
pnpm build:android:production

# Submit via EAS
eas submit --platform android --path=./android/app/build/outputs/bundle/release/app-release.aab
```

## Rollback Procedures

### 1. Application Rollback

Quick rollback to previous version:

```bash
# Rollback API service
aws ecs update-service \
    --cluster dhanam-production \
    --service dhanam-api \
    --task-definition dhanam-api:PREVIOUS_REVISION

# Rollback web service
aws ecs update-service \
    --cluster dhanam-production \
    --service dhanam-web \
    --task-definition dhanam-web:PREVIOUS_REVISION
```

### 2. Database Rollback

Point-in-time recovery:

```bash
# Restore database to specific point in time
aws rds restore-db-instance-to-point-in-time \
    --source-db-instance-identifier dhanam-production \
    --target-db-instance-identifier dhanam-production-rollback \
    --restore-time 2024-01-01T12:00:00Z
```

## Maintenance

### 1. Regular Updates

Monthly maintenance schedule:

```bash
# Security patches
- OS updates for ECS instances
- Database engine updates
- SSL certificate renewal

# Application updates
- Dependency updates
- Security vulnerability fixes
- Performance optimizations
```

### 2. Health Checks

Application health monitoring:

```bash
# API health check
GET /health
Response: {"status": "healthy", "timestamp": "2024-01-01T12:00:00Z"}

# Database health check
GET /health/database
Response: {"status": "healthy", "connections": 5, "queries_per_second": 150}

# Provider health checks
GET /health/providers
Response: {
  "plaid": "healthy",
  "belvo": "healthy", 
  "bitso": "healthy"
}
```

## Troubleshooting

### 1. Common Issues

#### High Memory Usage
```bash
# Check ECS task metrics
aws ecs describe-services --cluster dhanam-production --services dhanam-api

# Scale up if needed
aws application-autoscaling register-scalable-target \
    --service-namespace ecs \
    --resource-id service/dhanam-production/dhanam-api \
    --scalable-dimension ecs:service:DesiredCount \
    --max-capacity 15
```

#### Database Connection Issues
```bash
# Check RDS metrics
aws cloudwatch get-metric-statistics \
    --namespace AWS/RDS \
    --metric-name DatabaseConnections \
    --dimensions Name=DBInstanceIdentifier,Value=dhanam-production

# Increase connection pool if needed
```

#### Provider API Issues
```bash
# Check provider status pages
- Plaid: https://status.plaid.com/
- Belvo: https://status.belvo.co/
- Bitso: https://status.bitso.com/

# Implement circuit breaker pattern
# Fallback to cached data during outages
```

### 2. Emergency Procedures

#### Total System Outage
```bash
# 1. Check AWS Service Health Dashboard
# 2. Verify DNS resolution
# 3. Check CloudFront distribution
# 4. Verify ECS service status
# 5. Check RDS availability
# 6. Review CloudWatch logs
# 7. Activate DR region if needed
```

## Support and Documentation

### Resources
- **Infrastructure Docs**: `/infra/terraform/README.md`
- **Runbooks**: `/docs/runbooks/`
- **Architecture Diagrams**: `/docs/architecture/`
- **API Documentation**: `/docs/API.md`

### Emergency Contacts
- **DevOps Team**: devops@dhanam.io
- **On-call Engineer**: +1-555-000-0000
- **AWS Support**: Enterprise Support Plan
- **Incident Management**: PagerDuty integration

---

**Last Updated**: January 2024  
**Infrastructure Version**: v1.0.0  
**Supported Regions**: us-east-1 (primary), us-west-2 (DR)
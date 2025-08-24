# Dhanam Infrastructure as Code

This directory contains the Terraform configuration for deploying the Dhanam Ledger application on AWS using ECS Fargate.

## Architecture Overview

The infrastructure includes:

- **Networking**: Multi-AZ VPC with public/private/database subnets
- **Compute**: ECS Fargate for containerized API and web applications
- **Database**: RDS PostgreSQL with Multi-AZ for high availability
- **Cache**: ElastiCache Redis for session storage and job queues
- **Load Balancing**: Application Load Balancer with HTTPS support
- **Storage**: S3 for application data and ECR for container images
- **Security**: KMS encryption, WAF, Secrets Manager, and VPC endpoints
- **Monitoring**: CloudWatch logs, metrics, dashboards, and alarms

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Terraform** >= 1.0
3. **AWS CLI** configured with credentials
4. **Docker** for building and pushing images

## Initial Setup

### 1. Create S3 Backend Bucket

Before running Terraform, create the S3 bucket for state storage:

```bash
aws s3 mb s3://dhanam-terraform-state
aws s3api put-bucket-versioning --bucket dhanam-terraform-state --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket dhanam-terraform-state \
  --server-side-encryption-configuration '{"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]}'
```

### 2. Create DynamoDB Table for State Locking

```bash
aws dynamodb create-table \
  --table-name dhanam-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

### 3. Configure Variables

Copy the example variables file and update with your values:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your specific configuration.

## Deployment

### 1. Initialize Terraform

```bash
terraform init
```

### 2. Plan the Deployment

```bash
terraform plan
```

### 3. Apply the Configuration

```bash
terraform apply
```

### 4. Build and Push Docker Images

After the infrastructure is created, build and push your Docker images:

```bash
# Get ECR login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(terraform output -raw ecr_api_repository_url)

# Build and push API image
cd ../../apps/api
docker build -t $(terraform output -raw ecr_api_repository_url):latest .
docker push $(terraform output -raw ecr_api_repository_url):latest

# Build and push web image
cd ../web
docker build -t $(terraform output -raw ecr_web_repository_url):latest .
docker push $(terraform output -raw ecr_web_repository_url):latest
```

### 5. Update ECS Services

Force a new deployment to use the latest images:

```bash
aws ecs update-service \
  --cluster $(terraform output -raw ecs_cluster_name) \
  --service dhanam-prod-api \
  --force-new-deployment

aws ecs update-service \
  --cluster $(terraform output -raw ecs_cluster_name) \
  --service dhanam-prod-web \
  --force-new-deployment
```

## Module Structure

```
terraform/
├── main.tf              # Root module configuration
├── variables.tf         # Input variables
├── outputs.tf           # Output values
└── modules/
    ├── vpc/             # VPC and networking
    ├── ecs/             # ECS cluster and services
    ├── ecs-security/    # ECS security groups
    ├── rds/             # RDS PostgreSQL database
    ├── redis/           # ElastiCache Redis
    ├── alb/             # Application Load Balancer
    ├── ecr/             # Elastic Container Registry
    ├── security/        # KMS, Secrets Manager, WAF
    └── monitoring/      # CloudWatch and alarms
```

## Cost Optimization

For development/staging environments:

1. Set `single_nat_gateway = true` to use one NAT Gateway
2. Use smaller instance types (db.t3.micro, cache.t3.micro)
3. Set `db_multi_az = false` for single-AZ RDS
4. Reduce `api_desired_count` and `web_desired_count` to 1
5. Disable `db_deletion_protection` for easier cleanup

## Security Best Practices

1. **Secrets Management**: All sensitive data is stored in AWS Secrets Manager
2. **Encryption**: All data is encrypted at rest using KMS
3. **Network Security**: Private subnets for applications, VPC endpoints for AWS services
4. **WAF**: Protects against common web exploits
5. **IAM**: Least privilege access with specific roles for each service

## Monitoring and Alerts

- CloudWatch Dashboard: View all metrics in one place
- SNS Alerts: Email notifications for critical issues
- Auto Scaling: Automatic scaling based on CPU utilization
- Budget Alerts: Notifications when spending exceeds thresholds

## Backup and Recovery

- **RDS**: Automated daily backups with 30-day retention
- **Redis**: Daily snapshots with 7-day retention
- **S3**: Versioning enabled for application data

## Troubleshooting

### View ECS Task Logs

```bash
aws logs tail /ecs/dhanam-prod/api --follow
aws logs tail /ecs/dhanam-prod/web --follow
```

### Check Service Health

```bash
aws ecs describe-services \
  --cluster dhanam-prod-cluster \
  --services dhanam-prod-api dhanam-prod-web
```

### Database Connection

```bash
# Get RDS endpoint
terraform output rds_endpoint

# Connect using psql (from bastion or locally with VPN)
psql -h <endpoint> -U postgres -d dhanam
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will delete all resources including databases. Ensure you have backups if needed.

## Environment-Specific Configurations

### Production
- Multi-AZ deployment for high availability
- Deletion protection enabled
- Enhanced monitoring and longer log retention
- WAF enabled for additional security

### Staging
- Single NAT Gateway to reduce costs
- Smaller instance sizes
- Shorter backup retention
- Same security practices as production

### Development
- Minimal resources for cost optimization
- No deletion protection
- Basic monitoring
- Can be destroyed and recreated easily
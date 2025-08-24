#!/bin/bash

# Dhanam AWS Setup Script
# This script sets up the initial AWS resources needed for Terraform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
BUCKET_NAME="dhanam-terraform-state"
TABLE_NAME="dhanam-terraform-locks"

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

check_aws_cli() {
    print_info "Checking AWS CLI..."
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI not found. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    print_success "AWS CLI configured for account: $ACCOUNT_ID"
}

create_s3_bucket() {
    print_info "Creating S3 bucket for Terraform state..."
    
    # Check if bucket exists
    if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
        print_info "Bucket $BUCKET_NAME already exists"
    else
        # Create bucket
        if [ "$AWS_REGION" = "us-east-1" ]; then
            aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$AWS_REGION"
        else
            aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$AWS_REGION" \
                --create-bucket-configuration LocationConstraint="$AWS_REGION"
        fi
        print_success "Created bucket: $BUCKET_NAME"
    fi
    
    # Enable versioning
    aws s3api put-bucket-versioning \
        --bucket "$BUCKET_NAME" \
        --versioning-configuration Status=Enabled
    print_success "Enabled versioning on bucket"
    
    # Enable encryption
    aws s3api put-bucket-encryption \
        --bucket "$BUCKET_NAME" \
        --server-side-encryption-configuration '{"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]}'
    print_success "Enabled encryption on bucket"
    
    # Block public access
    aws s3api put-public-access-block \
        --bucket "$BUCKET_NAME" \
        --public-access-block-configuration \
        "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
    print_success "Blocked public access on bucket"
}

create_dynamodb_table() {
    print_info "Creating DynamoDB table for Terraform state locking..."
    
    # Check if table exists
    if aws dynamodb describe-table --table-name "$TABLE_NAME" --region "$AWS_REGION" &> /dev/null; then
        print_info "Table $TABLE_NAME already exists"
    else
        # Create table
        aws dynamodb create-table \
            --table-name "$TABLE_NAME" \
            --attribute-definitions AttributeName=LockID,AttributeType=S \
            --key-schema AttributeName=LockID,KeyType=HASH \
            --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
            --region "$AWS_REGION"
        
        # Wait for table to be active
        print_info "Waiting for table to be active..."
        aws dynamodb wait table-exists --table-name "$TABLE_NAME" --region "$AWS_REGION"
        print_success "Created table: $TABLE_NAME"
    fi
}

create_ecr_repositories() {
    print_info "Creating ECR repositories..."
    
    # Create API repository
    if aws ecr describe-repositories --repository-names "dhanam-prod-api" --region "$AWS_REGION" &> /dev/null; then
        print_info "Repository dhanam-prod-api already exists"
    else
        aws ecr create-repository \
            --repository-name "dhanam-prod-api" \
            --region "$AWS_REGION" \
            --image-scanning-configuration scanOnPush=true
        print_success "Created repository: dhanam-prod-api"
    fi
    
    # Create Web repository
    if aws ecr describe-repositories --repository-names "dhanam-prod-web" --region "$AWS_REGION" &> /dev/null; then
        print_info "Repository dhanam-prod-web already exists"
    else
        aws ecr create-repository \
            --repository-name "dhanam-prod-web" \
            --region "$AWS_REGION" \
            --image-scanning-configuration scanOnPush=true
        print_success "Created repository: dhanam-prod-web"
    fi
}

setup_iam_user() {
    print_info "Setting up IAM user for CI/CD..."
    
    USER_NAME="dhanam-ci-cd"
    
    # Check if user exists
    if aws iam get-user --user-name "$USER_NAME" &> /dev/null; then
        print_info "User $USER_NAME already exists"
    else
        # Create user
        aws iam create-user --user-name "$USER_NAME"
        print_success "Created IAM user: $USER_NAME"
    fi
    
    # Attach policies
    aws iam attach-user-policy \
        --user-name "$USER_NAME" \
        --policy-arn "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser"
    
    aws iam attach-user-policy \
        --user-name "$USER_NAME" \
        --policy-arn "arn:aws:iam::aws:policy/AmazonECS_FullAccess"
    
    print_success "Attached required policies to user"
    
    print_info "To create access keys for CI/CD, run:"
    echo "aws iam create-access-key --user-name $USER_NAME"
}

main() {
    echo "🛠️  Dhanam AWS Setup Script"
    echo "Region: $AWS_REGION"
    echo ""
    
    check_aws_cli
    create_s3_bucket
    create_dynamodb_table
    create_ecr_repositories
    setup_iam_user
    
    echo ""
    print_success "AWS setup completed successfully! 🎉"
    echo ""
    echo "Next steps:"
    echo "1. Update terraform backend configuration in main.tf if needed"
    echo "2. Copy terraform.tfvars.example to terraform.tfvars and update values"
    echo "3. Run 'terraform init' in the terraform directory"
    echo "4. Run 'terraform plan' to review the infrastructure"
    echo "5. Run 'terraform apply' to create the infrastructure"
}

# Show help
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: ./setup-aws.sh"
    echo ""
    echo "This script sets up the initial AWS resources needed for Terraform:"
    echo "  - S3 bucket for Terraform state"
    echo "  - DynamoDB table for state locking"
    echo "  - ECR repositories for Docker images"
    echo "  - IAM user for CI/CD"
    echo ""
    echo "Environment variables:"
    echo "  AWS_REGION    AWS region (default: us-east-1)"
    exit 0
fi

main
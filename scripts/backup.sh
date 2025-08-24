#!/bin/bash

# Dhanam Database Backup Script
# This script creates automated backups of the PostgreSQL database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
BACKUP_TYPE=${2:-manual}  # manual, daily, weekly, monthly
AWS_REGION=${AWS_REGION:-us-east-1}
TERRAFORM_DIR="infra/terraform"
BACKUP_BUCKET="dhanam-backups-$ENVIRONMENT"
RETENTION_DAYS=30

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

# Get database credentials from AWS Secrets Manager
get_db_credentials() {
    print_info "Getting database credentials..."
    
    DB_SECRET_ARN=$(aws secretsmanager describe-secret \
        --secret-id "dhanam-$ENVIRONMENT-db-credentials" \
        --query 'ARN' \
        --output text \
        --region $AWS_REGION 2>/dev/null || echo "")
    
    if [ -z "$DB_SECRET_ARN" ]; then
        print_error "Could not find database credentials in Secrets Manager"
        exit 1
    fi
    
    DB_CREDENTIALS=$(aws secretsmanager get-secret-value \
        --secret-id $DB_SECRET_ARN \
        --query 'SecretString' \
        --output text \
        --region $AWS_REGION)
    
    DB_HOST=$(echo $DB_CREDENTIALS | jq -r '.host')
    DB_PORT=$(echo $DB_CREDENTIALS | jq -r '.port')
    DB_NAME=$(echo $DB_CREDENTIALS | jq -r '.database')
    DB_USER=$(echo $DB_CREDENTIALS | jq -r '.username')
    DB_PASS=$(echo $DB_CREDENTIALS | jq -r '.password')
    
    print_success "Retrieved database credentials"
}

# Create backup
create_backup() {
    print_info "Creating database backup..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="dhanam_${ENVIRONMENT}_${BACKUP_TYPE}_${TIMESTAMP}.sql.gz"
    
    # Use pg_dump through SSH tunnel or direct connection
    export PGPASSWORD=$DB_PASS
    pg_dump \
        -h $DB_HOST \
        -p $DB_PORT \
        -U $DB_USER \
        -d $DB_NAME \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        | gzip > /tmp/$BACKUP_FILE
    
    unset PGPASSWORD
    
    # Check backup size
    BACKUP_SIZE=$(du -h /tmp/$BACKUP_FILE | cut -f1)
    print_success "Created backup: $BACKUP_FILE ($BACKUP_SIZE)"
}

# Upload to S3
upload_backup() {
    print_info "Uploading backup to S3..."
    
    # Create S3 bucket if it doesn't exist
    if ! aws s3api head-bucket --bucket $BACKUP_BUCKET 2>/dev/null; then
        aws s3api create-bucket \
            --bucket $BACKUP_BUCKET \
            --region $AWS_REGION \
            --create-bucket-configuration LocationConstraint=$AWS_REGION
        
        # Enable versioning
        aws s3api put-bucket-versioning \
            --bucket $BACKUP_BUCKET \
            --versioning-configuration Status=Enabled
        
        # Set lifecycle policy for retention
        cat > /tmp/lifecycle.json <<EOF
{
    "Rules": [{
        "ID": "DeleteOldBackups",
        "Status": "Enabled",
        "Filter": {},
        "Expiration": {
            "Days": $RETENTION_DAYS
        }
    }]
}
EOF
        aws s3api put-bucket-lifecycle-configuration \
            --bucket $BACKUP_BUCKET \
            --lifecycle-configuration file:///tmp/lifecycle.json
        
        rm /tmp/lifecycle.json
    fi
    
    # Upload backup with metadata
    aws s3 cp /tmp/$BACKUP_FILE s3://$BACKUP_BUCKET/$BACKUP_TYPE/ \
        --metadata "environment=$ENVIRONMENT,type=$BACKUP_TYPE,timestamp=$TIMESTAMP"
    
    # Clean up local file
    rm /tmp/$BACKUP_FILE
    
    print_success "Backup uploaded to S3"
}

# List backups
list_backups() {
    print_info "Listing available backups..."
    
    aws s3 ls s3://$BACKUP_BUCKET/ --recursive \
        | grep -E '\.sql\.gz$' \
        | sort -k1,2 -r \
        | head -20
}

# Restore from backup
restore_backup() {
    BACKUP_FILE=$3
    
    if [ -z "$BACKUP_FILE" ]; then
        print_error "Please specify a backup file to restore"
        echo "Usage: ./backup.sh $ENVIRONMENT restore <backup-file>"
        exit 1
    fi
    
    print_info "Restoring from backup: $BACKUP_FILE"
    
    # Download backup
    aws s3 cp s3://$BACKUP_BUCKET/$BACKUP_FILE /tmp/restore.sql.gz
    
    # Confirm restoration
    echo -e "${YELLOW}WARNING: This will replace all data in the $ENVIRONMENT database!${NC}"
    read -p "Are you sure you want to continue? (yes/no): " CONFIRM
    
    if [ "$CONFIRM" != "yes" ]; then
        print_info "Restoration cancelled"
        exit 0
    fi
    
    # Restore database
    export PGPASSWORD=$DB_PASS
    gunzip -c /tmp/restore.sql.gz | psql \
        -h $DB_HOST \
        -p $DB_PORT \
        -U $DB_USER \
        -d $DB_NAME
    
    unset PGPASSWORD
    
    # Clean up
    rm /tmp/restore.sql.gz
    
    print_success "Database restored successfully"
}

# Verify backup
verify_backup() {
    print_info "Verifying last backup..."
    
    LATEST_BACKUP=$(aws s3 ls s3://$BACKUP_BUCKET/$BACKUP_TYPE/ \
        | grep -E '\.sql\.gz$' \
        | sort -k1,2 -r \
        | head -1 \
        | awk '{print $4}')
    
    if [ -z "$LATEST_BACKUP" ]; then
        print_error "No backups found"
        exit 1
    fi
    
    # Download and check backup
    aws s3 cp s3://$BACKUP_BUCKET/$BACKUP_TYPE/$LATEST_BACKUP /tmp/verify.sql.gz
    
    if gunzip -t /tmp/verify.sql.gz 2>/dev/null; then
        print_success "Backup is valid: $LATEST_BACKUP"
    else
        print_error "Backup is corrupted: $LATEST_BACKUP"
    fi
    
    rm /tmp/verify.sql.gz
}

# Main logic
main() {
    case $BACKUP_TYPE in
        manual|daily|weekly|monthly)
            get_db_credentials
            create_backup
            upload_backup
            verify_backup
            ;;
        list)
            list_backups
            ;;
        restore)
            get_db_credentials
            restore_backup
            ;;
        verify)
            verify_backup
            ;;
        *)
            print_error "Invalid backup type: $BACKUP_TYPE"
            echo "Valid types: manual, daily, weekly, monthly, list, restore, verify"
            exit 1
            ;;
    esac
}

# Show help
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: ./backup.sh [environment] [type]"
    echo ""
    echo "Arguments:"
    echo "  environment    The environment (default: staging)"
    echo "  type          Backup type (default: manual)"
    echo "                Options: manual, daily, weekly, monthly, list, restore, verify"
    echo ""
    echo "Examples:"
    echo "  ./backup.sh staging manual    # Create manual backup"
    echo "  ./backup.sh production list    # List available backups"
    echo "  ./backup.sh staging restore daily/backup_20240101_120000.sql.gz"
    exit 0
fi

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    exit 1
fi

# Check dependencies
if ! command -v pg_dump &> /dev/null; then
    print_error "pg_dump not found. Please install PostgreSQL client tools."
    exit 1
fi

if ! command -v jq &> /dev/null; then
    print_error "jq not found. Please install jq."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &>/dev/null; then
    print_error "AWS credentials not configured"
    exit 1
fi

print_info "Dhanam Database Backup Script"
print_info "Environment: $ENVIRONMENT"
print_info "Backup Type: $BACKUP_TYPE"
echo ""

main

echo ""
print_success "Backup operation completed!"
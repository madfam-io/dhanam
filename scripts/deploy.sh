#!/bin/bash

# Dhanam Deployment Script
# This script builds and deploys the Dhanam application to AWS ECS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-prod}
AWS_REGION=${AWS_REGION:-us-east-1}
TERRAFORM_DIR="../infra/terraform"

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

check_dependencies() {
    print_info "Checking dependencies..."
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI not found. Please install it first."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found. Please install it first."
        exit 1
    fi
    
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform not found. Please install it first."
        exit 1
    fi
    
    print_success "All dependencies found"
}

get_terraform_outputs() {
    print_info "Getting Terraform outputs..."
    cd $TERRAFORM_DIR
    
    ECR_API_URL=$(terraform output -raw ecr_api_repository_url 2>/dev/null || echo "")
    ECR_WEB_URL=$(terraform output -raw ecr_web_repository_url 2>/dev/null || echo "")
    ECS_CLUSTER=$(terraform output -raw ecs_cluster_name 2>/dev/null || echo "")
    
    cd - > /dev/null
    
    if [ -z "$ECR_API_URL" ] || [ -z "$ECR_WEB_URL" ] || [ -z "$ECS_CLUSTER" ]; then
        print_error "Could not get Terraform outputs. Make sure infrastructure is deployed."
        exit 1
    fi
    
    print_success "Retrieved Terraform outputs"
}

docker_login() {
    print_info "Logging into ECR..."
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_API_URL
    print_success "Logged into ECR"
}

build_and_push_api() {
    print_info "Building API Docker image..."
    cd apps/api
    
    # Build the image
    docker build -t $ECR_API_URL:latest -t $ECR_API_URL:$GITHUB_SHA .
    
    # Push both tags
    docker push $ECR_API_URL:latest
    docker push $ECR_API_URL:$GITHUB_SHA
    
    cd - > /dev/null
    print_success "API image built and pushed"
}

build_and_push_web() {
    print_info "Building Web Docker image..."
    cd apps/web
    
    # Build the image
    docker build -t $ECR_WEB_URL:latest -t $ECR_WEB_URL:$GITHUB_SHA .
    
    # Push both tags
    docker push $ECR_WEB_URL:latest
    docker push $ECR_WEB_URL:$GITHUB_SHA
    
    cd - > /dev/null
    print_success "Web image built and pushed"
}

update_ecs_services() {
    print_info "Updating ECS services..."
    
    # Update API service
    aws ecs update-service \
        --cluster $ECS_CLUSTER \
        --service dhanam-$ENVIRONMENT-api \
        --force-new-deployment \
        --region $AWS_REGION > /dev/null
    
    # Update Web service
    aws ecs update-service \
        --cluster $ECS_CLUSTER \
        --service dhanam-$ENVIRONMENT-web \
        --force-new-deployment \
        --region $AWS_REGION > /dev/null
    
    print_success "ECS services updated"
}

wait_for_deployment() {
    print_info "Waiting for deployments to complete..."
    
    # Wait for API service
    aws ecs wait services-stable \
        --cluster $ECS_CLUSTER \
        --services dhanam-$ENVIRONMENT-api \
        --region $AWS_REGION
    
    # Wait for Web service
    aws ecs wait services-stable \
        --cluster $ECS_CLUSTER \
        --services dhanam-$ENVIRONMENT-web \
        --region $AWS_REGION
    
    print_success "Deployments completed successfully"
}

run_migrations() {
    print_info "Running database migrations..."
    
    # Run migrations using ECS task
    MIGRATION_TASK=$(aws ecs run-task \
        --cluster $ECS_CLUSTER \
        --task-definition dhanam-$ENVIRONMENT-api \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[],securityGroups=[],assignPublicIp=DISABLED}" \
        --overrides '{"containerOverrides":[{"name":"api","command":["pnpm","db:migrate"]}]}' \
        --region $AWS_REGION \
        --query 'tasks[0].taskArn' \
        --output text)
    
    # Wait for migration to complete
    aws ecs wait tasks-stopped \
        --cluster $ECS_CLUSTER \
        --tasks $MIGRATION_TASK \
        --region $AWS_REGION
    
    print_success "Migrations completed"
}

main() {
    echo "🚀 Dhanam Deployment Script"
    echo "Environment: $ENVIRONMENT"
    echo ""
    
    # Get GitHub SHA for tagging
    GITHUB_SHA=${GITHUB_SHA:-$(git rev-parse --short HEAD)}
    
    check_dependencies
    get_terraform_outputs
    docker_login
    build_and_push_api
    build_and_push_web
    update_ecs_services
    
    if [ "$RUN_MIGRATIONS" = "true" ]; then
        run_migrations
    fi
    
    wait_for_deployment
    
    echo ""
    print_success "Deployment completed successfully! 🎉"
    echo ""
    echo "API URL: https://your-domain.com/api"
    echo "Web URL: https://your-domain.com"
}

# Show help
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: ./deploy.sh [environment]"
    echo ""
    echo "Options:"
    echo "  environment    The environment to deploy to (default: prod)"
    echo ""
    echo "Environment variables:"
    echo "  AWS_REGION      AWS region (default: us-east-1)"
    echo "  RUN_MIGRATIONS  Run database migrations (default: false)"
    echo "  GITHUB_SHA      Git commit SHA for tagging (default: current HEAD)"
    exit 0
fi

main
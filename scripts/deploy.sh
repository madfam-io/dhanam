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
ENVIRONMENT=${1:-staging}
ACTION=${2:-deploy}
AWS_REGION=${AWS_REGION:-us-east-1}
TERRAFORM_DIR="infra/terraform"
PROJECT_NAME="dhanam"

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
    pushd $TERRAFORM_DIR > /dev/null
    
    ECR_API_URL=$(terraform output -raw ecr_api_repository_url 2>/dev/null || echo "")
    ECR_WEB_URL=$(terraform output -raw ecr_web_repository_url 2>/dev/null || echo "")
    ECS_CLUSTER=$(terraform output -raw ecs_cluster_name 2>/dev/null || echo "")
    ALB_DNS=$(terraform output -raw alb_dns_name 2>/dev/null || echo "")
    
    popd > /dev/null
    
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
    
    # Build the image with cache
    docker build \
        --cache-from $ECR_API_URL:latest \
        -t $PROJECT_NAME-api:latest \
        -f apps/api/Dockerfile \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        .
    
    # Tag and push
    docker tag $PROJECT_NAME-api:latest $ECR_API_URL:latest
    docker tag $PROJECT_NAME-api:latest $ECR_API_URL:$GITHUB_SHA
    docker push $ECR_API_URL:latest
    docker push $ECR_API_URL:$GITHUB_SHA
    
    print_success "API image built and pushed"
}

build_and_push_web() {
    print_info "Building Web Docker image..."
    
    # Build the image with cache
    docker build \
        --cache-from $ECR_WEB_URL:latest \
        -t $PROJECT_NAME-web:latest \
        -f apps/web/Dockerfile \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --build-arg NEXT_PUBLIC_API_URL=https://$ALB_DNS/api \
        .
    
    # Tag and push
    docker tag $PROJECT_NAME-web:latest $ECR_WEB_URL:latest
    docker tag $PROJECT_NAME-web:latest $ECR_WEB_URL:$GITHUB_SHA
    docker push $ECR_WEB_URL:latest
    docker push $ECR_WEB_URL:$GITHUB_SHA
    
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
    
    # Get subnet and security group from Terraform
    pushd $TERRAFORM_DIR > /dev/null
    SUBNETS=$(terraform output -json private_subnet_ids | jq -r 'join(",")')
    SECURITY_GROUP=$(terraform output -raw ecs_security_group_id)
    popd > /dev/null
    
    # Run migrations using ECS task
    MIGRATION_TASK=$(aws ecs run-task \
        --cluster $ECS_CLUSTER \
        --task-definition $PROJECT_NAME-$ENVIRONMENT-api \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SECURITY_GROUP],assignPublicIp=DISABLED}" \
        --overrides '{"containerOverrides":[{"name":"api","command":["pnpm","db:push"]}]}' \
        --region $AWS_REGION \
        --query 'tasks[0].taskArn' \
        --output text)
    
    # Wait for migration to complete
    aws ecs wait tasks-stopped \
        --cluster $ECS_CLUSTER \
        --tasks $MIGRATION_TASK \
        --region $AWS_REGION
    
    # Check exit code
    EXIT_CODE=$(aws ecs describe-tasks \
        --cluster $ECS_CLUSTER \
        --tasks $MIGRATION_TASK \
        --query 'tasks[0].containers[0].exitCode' \
        --output text)
    
    if [ "$EXIT_CODE" != "0" ]; then
        print_error "Migrations failed with exit code $EXIT_CODE"
        exit 1
    fi
    
    print_success "Migrations completed"
}

health_check() {
    print_info "Running health checks..."
    
    # Check API health
    if curl -f -s "https://$ALB_DNS/api/health" > /dev/null; then
        print_success "API health check passed"
    else
        print_error "API health check failed"
        return 1
    fi
    
    # Check Web health
    if curl -f -s "https://$ALB_DNS" > /dev/null; then
        print_success "Web health check passed"
    else
        print_error "Web health check failed"
        return 1
    fi
}

rollback() {
    print_info "Rolling back deployment..."
    
    # Get previous task definition
    PREVIOUS_API=$(aws ecs describe-services \
        --cluster $ECS_CLUSTER \
        --services $PROJECT_NAME-$ENVIRONMENT-api \
        --query 'services[0].deployments[1].taskDefinition' \
        --output text \
        --region $AWS_REGION)
    
    PREVIOUS_WEB=$(aws ecs describe-services \
        --cluster $ECS_CLUSTER \
        --services $PROJECT_NAME-$ENVIRONMENT-web \
        --query 'services[0].deployments[1].taskDefinition' \
        --output text \
        --region $AWS_REGION)
    
    if [ "$PREVIOUS_API" != "None" ] && [ "$PREVIOUS_WEB" != "None" ]; then
        # Rollback services
        aws ecs update-service \
            --cluster $ECS_CLUSTER \
            --service $PROJECT_NAME-$ENVIRONMENT-api \
            --task-definition $PREVIOUS_API \
            --region $AWS_REGION > /dev/null
        
        aws ecs update-service \
            --cluster $ECS_CLUSTER \
            --service $PROJECT_NAME-$ENVIRONMENT-web \
            --task-definition $PREVIOUS_WEB \
            --region $AWS_REGION > /dev/null
        
        wait_for_deployment
        print_success "Rolled back to previous version"
    else
        print_error "No previous version found for rollback"
        exit 1
    fi
}

full_deploy() {
    echo "🚀 Dhanam Deployment Script"
    echo "Environment: $ENVIRONMENT"
    echo "Action: $ACTION"
    echo ""
    
    # Get GitHub SHA for tagging
    GITHUB_SHA=${GITHUB_SHA:-$(git rev-parse --short HEAD)}
    
    check_dependencies
    get_terraform_outputs
    docker_login
    build_and_push_api
    build_and_push_web
    run_migrations
    update_ecs_services
    wait_for_deployment
    health_check
    
    echo ""
    print_success "Deployment completed successfully! 🎉"
    echo ""
    echo "API URL: https://$ALB_DNS/api"
    echo "Web URL: https://$ALB_DNS"
}

main() {
    case $ACTION in
        deploy)
            full_deploy
            ;;
        build)
            GITHUB_SHA=${GITHUB_SHA:-$(git rev-parse --short HEAD)}
            check_dependencies
            get_terraform_outputs
            docker_login
            build_and_push_api
            build_and_push_web
            ;;
        migrate)
            check_dependencies
            get_terraform_outputs
            run_migrations
            ;;
        rollback)
            check_dependencies
            get_terraform_outputs
            rollback
            ;;
        health)
            get_terraform_outputs
            health_check
            ;;
        *)
            print_error "Invalid action: $ACTION"
            echo "Valid actions: deploy, build, migrate, rollback, health"
            exit 1
            ;;
    esac
}

# Show help
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: ./deploy.sh [environment] [action]"
    echo ""
    echo "Arguments:"
    echo "  environment    The environment to deploy to (default: staging)"
    echo "                 Options: staging, production"
    echo "  action         The deployment action (default: deploy)"
    echo "                 Options: deploy, build, migrate, rollback, health"
    echo ""
    echo "Environment variables:"
    echo "  AWS_REGION      AWS region (default: us-east-1)"
    echo "  GITHUB_SHA      Git commit SHA for tagging (default: current HEAD)"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh staging deploy    # Full deployment to staging"
    echo "  ./deploy.sh production build  # Build and push images only"
    echo "  ./deploy.sh staging rollback  # Rollback to previous version"
    exit 0
fi

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT. Must be 'staging' or 'production'"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &>/dev/null; then
    print_error "AWS credentials not configured. Please run 'aws configure'"
    exit 1
fi

main
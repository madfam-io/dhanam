#!/bin/bash

# Dhanam Development Environment Setup Script
# This script sets up the complete local development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
    
    # Check for pnpm
    if ! command -v pnpm &> /dev/null; then
        print_warning "pnpm is not installed. Installing pnpm..."
        npm install -g pnpm
    fi
    
    # Check for Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker Desktop."
        exit 1
    fi
    
    # Check for Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed."
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Setup environment files
setup_env_files() {
    print_info "Setting up environment files..."
    
    # API environment
    if [ ! -f "apps/api/.env" ]; then
        cat > apps/api/.env << EOF
# Database
DATABASE_URL="postgresql://dhanam:dhanam_dev_password@localhost:5432/dhanam_dev?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secrets (generate new ones for production)
JWT_SECRET="dev_jwt_secret_change_in_production"
JWT_REFRESH_SECRET="dev_jwt_refresh_secret_change_in_production"

# Encryption (generate new key for production)
ENCRYPTION_KEY="dev_encryption_key_32_characters!"

# Email (Mailhog for local development)
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@dhanam.local"

# AWS (LocalStack for local development)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="test"
AWS_SECRET_ACCESS_KEY="test"
AWS_S3_BUCKET="dhanam-dev-uploads"
AWS_KMS_KEY_ID="dev-key"
LOCALSTACK_ENDPOINT="http://localhost:4566"

# Provider APIs (use sandbox credentials)
BELVO_SECRET_ID="sandbox"
BELVO_SECRET_PASSWORD="sandbox"
BELVO_ENV="sandbox"

PLAID_CLIENT_ID="sandbox_client_id"
PLAID_SECRET="sandbox_secret"
PLAID_ENV="sandbox"

BITSO_API_KEY=""
BITSO_API_SECRET=""
BITSO_ENV="sandbox"

# Banxico API
BANXICO_API_KEY=""

# Feature Flags
ENABLE_ESG="true"
ENABLE_CRYPTO="true"

# Environment
NODE_ENV="development"
PORT="4000"
EOF
        print_success "Created apps/api/.env"
    else
        print_warning "apps/api/.env already exists, skipping..."
    fi
    
    # Web environment
    if [ ! -f "apps/web/.env.local" ]; then
        cat > apps/web/.env.local << EOF
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000

# Analytics (leave empty for local development)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# Feature Flags
NEXT_PUBLIC_ENABLE_ESG=true
NEXT_PUBLIC_ENABLE_CRYPTO=true

# Locale
NEXT_PUBLIC_DEFAULT_LOCALE=es
EOF
        print_success "Created apps/web/.env.local"
    else
        print_warning "apps/web/.env.local already exists, skipping..."
    fi
    
    # Mobile environment
    if [ ! -f "apps/mobile/.env" ]; then
        cat > apps/mobile/.env << EOF
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:4000

# Feature Flags
EXPO_PUBLIC_ENABLE_ESG=true
EXPO_PUBLIC_ENABLE_CRYPTO=true

# Locale
EXPO_PUBLIC_DEFAULT_LOCALE=es
EOF
        print_success "Created apps/mobile/.env"
    else
        print_warning "apps/mobile/.env already exists, skipping..."
    fi
}

# Start Docker services
start_docker_services() {
    print_info "Starting Docker services..."
    
    # Start base services
    docker-compose up -d
    
    # Start development services
    docker-compose -f docker-compose.dev.yml up -d
    
    # Wait for services to be healthy
    print_info "Waiting for services to be healthy..."
    sleep 10
    
    # Check service health
    if docker-compose ps | grep -q "unhealthy"; then
        print_error "Some services are unhealthy. Check docker-compose logs."
        docker-compose ps
        exit 1
    fi
    
    print_success "All Docker services are running"
}

# Setup LocalStack resources
setup_localstack() {
    print_info "Setting up LocalStack resources..."
    
    # Create S3 bucket
    aws --endpoint-url=http://localhost:4566 s3 mb s3://dhanam-dev-uploads 2>/dev/null || true
    
    # Create KMS key
    aws --endpoint-url=http://localhost:4566 kms create-key \
        --description "Dhanam dev encryption key" 2>/dev/null || true
    
    print_success "LocalStack resources created"
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    
    pnpm install
    
    print_success "Dependencies installed"
}

# Setup database
setup_database() {
    print_info "Setting up database..."
    
    cd apps/api
    
    # Generate Prisma client
    pnpm prisma generate
    
    # Run migrations
    pnpm prisma migrate dev --name init
    
    # Seed database
    pnpm db:seed
    
    cd ../..
    
    print_success "Database setup complete"
}

# Build packages
build_packages() {
    print_info "Building shared packages..."
    
    pnpm build:packages
    
    print_success "Packages built"
}

# Main setup flow
main() {
    echo "🚀 Dhanam Development Environment Setup"
    echo "======================================="
    echo ""
    
    check_prerequisites
    setup_env_files
    start_docker_services
    setup_localstack
    install_dependencies
    setup_database
    build_packages
    
    echo ""
    echo "✅ Development environment setup complete!"
    echo ""
    echo "🎯 Next steps:"
    echo "  1. Start the API server:     cd apps/api && pnpm dev"
    echo "  2. Start the web app:        cd apps/web && pnpm dev"
    echo "  3. Start the mobile app:     cd apps/mobile && pnpm start"
    echo ""
    echo "📚 Useful URLs:"
    echo "  - Web App:        http://localhost:3000"
    echo "  - API:            http://localhost:4000"
    echo "  - API Docs:       http://localhost:4000/api"
    echo "  - Mailhog:        http://localhost:8025"
    echo "  - PgAdmin:        http://localhost:5050"
    echo "  - Redis Commander: http://localhost:8081"
    echo ""
    echo "🔐 Default credentials:"
    echo "  - PgAdmin:   admin@dhanam.local / admin"
    echo "  - Database:  dhanam / dhanam_dev_password"
    echo ""
}

# Run main function
main
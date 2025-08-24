#!/bin/bash

# Dhanam Local Development Setup Script
# This script sets up the local development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_step() {
    echo -e "${BLUE}Step $1:${NC} $2"
}

# Check system requirements
check_requirements() {
    print_step "1" "Checking system requirements"
    
    MISSING_DEPS=""
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2)
        print_success "Node.js $NODE_VERSION found"
        
        # Check if version is >= 18
        if [ "${NODE_VERSION%%.*}" -lt 18 ]; then
            print_error "Node.js version must be >= 18"
            MISSING_DEPS="$MISSING_DEPS node"
        fi
    else
        print_error "Node.js not found"
        MISSING_DEPS="$MISSING_DEPS node"
    fi
    
    # Check pnpm
    if command -v pnpm &> /dev/null; then
        print_success "pnpm $(pnpm -v) found"
    else
        print_error "pnpm not found"
        MISSING_DEPS="$MISSING_DEPS pnpm"
    fi
    
    # Check Docker
    if command -v docker &> /dev/null; then
        print_success "Docker $(docker -v | cut -d' ' -f3 | cut -d',' -f1) found"
    else
        print_error "Docker not found"
        MISSING_DEPS="$MISSING_DEPS docker"
    fi
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        print_success "Docker Compose found"
    else
        print_error "Docker Compose not found"
        MISSING_DEPS="$MISSING_DEPS docker-compose"
    fi
    
    # Check Git
    if command -v git &> /dev/null; then
        print_success "Git $(git --version | cut -d' ' -f3) found"
    else
        print_error "Git not found"
        MISSING_DEPS="$MISSING_DEPS git"
    fi
    
    if [ -n "$MISSING_DEPS" ]; then
        echo ""
        print_error "Missing dependencies:$MISSING_DEPS"
        echo ""
        echo "Installation instructions:"
        echo "  Node.js: https://nodejs.org/"
        echo "  pnpm: npm install -g pnpm"
        echo "  Docker: https://docs.docker.com/get-docker/"
        echo "  Git: https://git-scm.com/"
        exit 1
    fi
    
    echo ""
}

# Setup environment files
setup_env_files() {
    print_step "2" "Setting up environment files"
    
    # API .env
    if [ ! -f apps/api/.env ]; then
        print_info "Creating apps/api/.env"
        cat > apps/api/.env <<EOF
# Database
DATABASE_URL=postgresql://dhanam:dhanam123@localhost:5432/dhanam_dev

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Security
ENCRYPTION_KEY=$(openssl rand -base64 24)
TOTP_ENCRYPTION_KEY=$(openssl rand -base64 24)

# Email (Mailhog)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@dhanam.local

# Providers (add your test credentials)
BELVO_SECRET_ID=your_belvo_secret_id
BELVO_SECRET_PASSWORD=your_belvo_secret_password
BELVO_ENV=sandbox

PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox

BITSO_API_KEY=your_bitso_api_key
BITSO_API_SECRET=your_bitso_api_secret

# FX Rates
BANXICO_API_TOKEN=your_banxico_token
EOF
        print_success "Created apps/api/.env"
    else
        print_info "apps/api/.env already exists"
    fi
    
    # Web .env.local
    if [ ! -f apps/web/.env.local ]; then
        print_info "Creating apps/web/.env.local"
        cat > apps/web/.env.local <<EOF
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_POSTHOG_KEY=phc_development_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_DEFAULT_LOCALE=es
EOF
        print_success "Created apps/web/.env.local"
    else
        print_info "apps/web/.env.local already exists"
    fi
    
    # Mobile .env
    if [ ! -f apps/mobile/.env ]; then
        print_info "Creating apps/mobile/.env"
        cat > apps/mobile/.env <<EOF
EXPO_PUBLIC_API_URL=http://localhost:4000
EXPO_PUBLIC_POSTHOG_KEY=phc_development_key
EXPO_PUBLIC_DEFAULT_LOCALE=es
EOF
        print_success "Created apps/mobile/.env"
    else
        print_info "apps/mobile/.env already exists"
    fi
    
    echo ""
}

# Install dependencies
install_dependencies() {
    print_step "3" "Installing dependencies"
    
    print_info "Running pnpm install..."
    pnpm install
    
    print_success "Dependencies installed"
    echo ""
}

# Start infrastructure
start_infrastructure() {
    print_step "4" "Starting local infrastructure"
    
    print_info "Starting Docker containers..."
    
    # Use docker compose or docker-compose
    if docker compose version &> /dev/null; then
        docker compose -f infra/docker/docker-compose.yml up -d
    else
        docker-compose -f infra/docker/docker-compose.yml up -d
    fi
    
    # Wait for services to be ready
    print_info "Waiting for services to be ready..."
    sleep 5
    
    # Check PostgreSQL
    until docker exec dhanam-postgres pg_isready -U dhanam &> /dev/null; do
        echo -n "."
        sleep 1
    done
    echo ""
    print_success "PostgreSQL is ready"
    
    # Check Redis
    until docker exec dhanam-redis redis-cli ping &> /dev/null; do
        echo -n "."
        sleep 1
    done
    print_success "Redis is ready"
    
    print_success "Infrastructure started"
    echo ""
}

# Setup database
setup_database() {
    print_step "5" "Setting up database"
    
    print_info "Running Prisma migrations..."
    cd apps/api
    pnpm db:push
    
    print_info "Seeding database..."
    pnpm db:seed
    
    cd ../..
    print_success "Database setup completed"
    echo ""
}

# Build packages
build_packages() {
    print_step "6" "Building packages"
    
    print_info "Building shared package..."
    cd packages/shared
    pnpm build
    cd ../..
    
    print_info "Building ESG package..."
    cd packages/esg
    pnpm build
    cd ../..
    
    print_info "Building UI package..."
    cd packages/ui
    pnpm build
    cd ../..
    
    print_success "Packages built"
    echo ""
}

# Show next steps
show_next_steps() {
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ Local development environment setup completed!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Start the development servers:"
    echo "   ${BLUE}pnpm dev${NC}"
    echo ""
    echo "2. Access the applications:"
    echo "   - Web app: ${BLUE}http://localhost:3000${NC}"
    echo "   - API: ${BLUE}http://localhost:4000${NC}"
    echo "   - API docs: ${BLUE}http://localhost:4000/api${NC}"
    echo "   - Mailhog: ${BLUE}http://localhost:8025${NC}"
    echo ""
    echo "3. Default credentials:"
    echo "   - Email: ${BLUE}admin@dhanam.com${NC}"
    echo "   - Password: ${BLUE}Admin123!${NC}"
    echo ""
    echo "4. Useful commands:"
    echo "   - ${BLUE}pnpm dev:api${NC}     # Start API only"
    echo "   - ${BLUE}pnpm dev:web${NC}     # Start web app only"
    echo "   - ${BLUE}pnpm dev:mobile${NC}  # Start mobile app"
    echo "   - ${BLUE}pnpm test${NC}        # Run tests"
    echo "   - ${BLUE}pnpm lint${NC}        # Run linter"
    echo "   - ${BLUE}pnpm db:studio${NC}   # Open Prisma Studio"
    echo ""
    echo "5. Stop infrastructure:"
    echo "   ${BLUE}docker compose -f infra/docker/docker-compose.yml down${NC}"
}

# Cleanup function
cleanup() {
    print_info "Cleaning up..."
    
    # Stop Docker containers
    if docker compose version &> /dev/null; then
        docker compose -f infra/docker/docker-compose.yml down
    else
        docker-compose -f infra/docker/docker-compose.yml down
    fi
    
    # Remove environment files
    rm -f apps/api/.env
    rm -f apps/web/.env.local
    rm -f apps/mobile/.env
    
    # Remove node_modules
    rm -rf node_modules
    rm -rf apps/*/node_modules
    rm -rf packages/*/node_modules
    
    print_success "Cleanup completed"
}

# Main execution
main() {
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                  Dhanam Local Development Setup                   ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    check_requirements
    setup_env_files
    install_dependencies
    start_infrastructure
    setup_database
    build_packages
    show_next_steps
}

# Handle arguments
case "${1:-setup}" in
    setup)
        main
        ;;
    cleanup)
        cleanup
        ;;
    --help|-h)
        echo "Usage: ./setup-local.sh [command]"
        echo ""
        echo "Commands:"
        echo "  setup     Setup local development environment (default)"
        echo "  cleanup   Clean up local environment"
        echo ""
        echo "This script will:"
        echo "  1. Check system requirements"
        echo "  2. Create environment files"
        echo "  3. Install dependencies"
        echo "  4. Start Docker containers"
        echo "  5. Setup database"
        echo "  6. Build packages"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac
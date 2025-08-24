#!/bin/bash

# Dhanam Development Environment Cleanup Script
# This script cleans up the local development environment

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

# Confirm cleanup
confirm_cleanup() {
    echo -e "${YELLOW}⚠️  WARNING: This will remove all local development data!${NC}"
    echo ""
    echo "This includes:"
    echo "  - Docker containers and volumes"
    echo "  - Database data"
    echo "  - Redis data"
    echo "  - LocalStack data"
    echo "  - node_modules directories"
    echo "  - Build artifacts"
    echo ""
    read -p "Are you sure you want to continue? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cleanup cancelled."
        exit 0
    fi
}

# Stop and remove Docker containers
cleanup_docker() {
    print_info "Stopping and removing Docker containers..."
    
    # Stop all containers
    docker-compose down -v
    docker-compose -f docker-compose.dev.yml down -v
    
    # Remove all project volumes
    docker volume rm dhanam_postgres_data 2>/dev/null || true
    docker volume rm dhanam_redis_data 2>/dev/null || true
    docker volume rm dhanam_localstack_data 2>/dev/null || true
    docker volume rm dhanam_pgadmin_data 2>/dev/null || true
    
    print_success "Docker cleanup complete"
}

# Clean node_modules
cleanup_node_modules() {
    print_info "Removing node_modules directories..."
    
    # Find and remove all node_modules directories
    find . -name "node_modules" -type d -prune -exec rm -rf '{}' + 2>/dev/null || true
    
    # Remove pnpm store
    rm -rf .pnpm-store 2>/dev/null || true
    
    print_success "node_modules cleanup complete"
}

# Clean build artifacts
cleanup_build_artifacts() {
    print_info "Removing build artifacts..."
    
    # Clean Next.js build
    rm -rf apps/web/.next 2>/dev/null || true
    rm -rf apps/web/out 2>/dev/null || true
    
    # Clean API build
    rm -rf apps/api/dist 2>/dev/null || true
    
    # Clean mobile build
    rm -rf apps/mobile/.expo 2>/dev/null || true
    
    # Clean package builds
    find packages -name "dist" -type d -prune -exec rm -rf '{}' + 2>/dev/null || true
    
    # Clean turbo cache
    rm -rf .turbo 2>/dev/null || true
    rm -rf node_modules/.cache 2>/dev/null || true
    
    print_success "Build artifacts cleanup complete"
}

# Clean environment files
cleanup_env_files() {
    print_info "Removing environment files..."
    
    # Remove .env files (but keep .env.example)
    find . -name ".env" -type f -delete 2>/dev/null || true
    find . -name ".env.local" -type f -delete 2>/dev/null || true
    
    print_success "Environment files cleanup complete"
}

# Clean logs and temp files
cleanup_logs() {
    print_info "Removing logs and temporary files..."
    
    # Remove log files
    find . -name "*.log" -type f -delete 2>/dev/null || true
    find . -name "npm-debug.log*" -type f -delete 2>/dev/null || true
    find . -name "yarn-debug.log*" -type f -delete 2>/dev/null || true
    find . -name "yarn-error.log*" -type f -delete 2>/dev/null || true
    find . -name "pnpm-debug.log*" -type f -delete 2>/dev/null || true
    
    # Remove coverage reports
    find . -name "coverage" -type d -prune -exec rm -rf '{}' + 2>/dev/null || true
    
    # Remove Jest cache
    find . -name ".jest" -type d -prune -exec rm -rf '{}' + 2>/dev/null || true
    
    print_success "Logs and temp files cleanup complete"
}

# Main cleanup flow
main() {
    echo "🧹 Dhanam Development Environment Cleanup"
    echo "========================================"
    echo ""
    
    confirm_cleanup
    
    cleanup_docker
    cleanup_node_modules
    cleanup_build_artifacts
    cleanup_env_files
    cleanup_logs
    
    echo ""
    echo "✅ Development environment cleanup complete!"
    echo ""
    echo "To set up the environment again, run:"
    echo "  ./scripts/dev-setup.sh"
    echo ""
}

# Run main function
main
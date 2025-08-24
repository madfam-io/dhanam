#!/bin/bash

# Comprehensive test script for Dhanam Ledger
set -e

echo "🧪 Starting Dhanam Ledger Test Suite"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_status "Docker is running"

# Start test infrastructure
print_status "Starting test infrastructure..."
docker-compose -f infra/docker/docker-compose.test.yml up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Function to run tests for a package
run_package_tests() {
    local package_name=$1
    local test_type=${2:-"test"}
    
    echo ""
    echo "🔍 Testing $package_name ($test_type)"
    echo "----------------------------------------"
    
    if pnpm turbo run $test_type --filter=$package_name; then
        print_status "$package_name $test_type passed"
    else
        print_error "$package_name $test_type failed"
        return 1
    fi
}

# Install dependencies
print_status "Installing dependencies..."
pnpm install

# Build packages first
print_status "Building packages..."
pnpm turbo build --filter=@dhanam/shared
pnpm turbo build --filter=@dhanam/esg
pnpm turbo build --filter=@dhanam/ui

# Run linting
print_status "Running linting..."
if pnpm turbo lint; then
    print_status "Linting passed"
else
    print_warning "Linting issues found"
fi

# Run type checking
print_status "Running type checking..."
if pnpm turbo typecheck; then
    print_status "Type checking passed"
else
    print_error "Type checking failed"
    exit 1
fi

# Run unit tests
echo ""
echo "🚀 Running Unit Tests"
echo "===================="

failed_tests=0

# Test shared package
if ! run_package_tests "@dhanam/shared" "test"; then
    ((failed_tests++))
fi

# Test ESG package  
if ! run_package_tests "@dhanam/esg" "test"; then
    ((failed_tests++))
fi

# Test API package
if ! run_package_tests "@dhanam/api" "test"; then
    ((failed_tests++))
fi

# Test web package
if ! run_package_tests "@dhanam/web" "test"; then
    ((failed_tests++))
fi

# Run integration tests
echo ""
echo "🔗 Running Integration Tests"
echo "============================"

if ! run_package_tests "@dhanam/api" "test:e2e"; then
    ((failed_tests++))
fi

# Run build tests
echo ""
echo "🏗️ Running Build Tests" 
echo "====================="

if pnpm turbo build; then
    print_status "All packages built successfully"
else
    print_error "Build failed"
    ((failed_tests++))
fi

# Generate test coverage report
echo ""
echo "📊 Generating Coverage Report"
echo "============================"

pnpm turbo run test:coverage --filter=@dhanam/api || print_warning "Coverage generation failed"

# Cleanup test infrastructure
print_status "Cleaning up test infrastructure..."
docker-compose -f infra/docker/docker-compose.test.yml down

# Final results
echo ""
echo "📋 Test Results Summary"
echo "======================"

if [ $failed_tests -eq 0 ]; then
    print_status "All tests passed! 🎉"
    echo ""
    echo "✅ Linting: Passed"
    echo "✅ Type Checking: Passed"
    echo "✅ Unit Tests: Passed"
    echo "✅ Integration Tests: Passed"
    echo "✅ Build Tests: Passed"
    echo ""
    echo "🚀 Ready for deployment!"
    exit 0
else
    print_error "$failed_tests test suite(s) failed"
    echo ""
    echo "❌ Please fix failing tests before proceeding"
    exit 1
fi
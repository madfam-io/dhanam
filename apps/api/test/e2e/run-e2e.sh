#!/bin/bash

# E2E Test Runner Script for Dhanam API
# This script sets up the test environment and runs E2E tests

set -e

echo "🧪 Starting E2E Test Setup..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from apps/api directory${NC}"
    exit 1
fi

# Function to check if a service is running
check_service() {
    local service=$1
    local port=$2
    
    if nc -z localhost $port 2>/dev/null; then
        echo -e "${GREEN}✓ $service is running on port $port${NC}"
        return 0
    else
        echo -e "${RED}✗ $service is not running on port $port${NC}"
        return 1
    fi
}

# Function to wait for a service
wait_for_service() {
    local service=$1
    local port=$2
    local max_attempts=30
    local attempt=0
    
    echo -e "${YELLOW}Waiting for $service to be ready...${NC}"
    
    while [ $attempt -lt $max_attempts ]; do
        if nc -z localhost $port 2>/dev/null; then
            echo -e "${GREEN}✓ $service is ready${NC}"
            return 0
        fi
        
        attempt=$((attempt + 1))
        sleep 1
    done
    
    echo -e "${RED}✗ $service failed to start${NC}"
    return 1
}

# Step 1: Check dependencies
echo -e "\n${YELLOW}Checking dependencies...${NC}"

# Check PostgreSQL
if ! check_service "PostgreSQL" 5433; then
    echo -e "${YELLOW}Starting test database...${NC}"
    cd ../.. && pnpm dev:infra:test && cd apps/api
    wait_for_service "PostgreSQL" 5433
fi

# Check Redis
if ! check_service "Redis" 6379; then
    echo -e "${YELLOW}Starting Redis...${NC}"
    cd ../.. && pnpm dev:infra && cd apps/api
    wait_for_service "Redis" 6379
fi

# Step 2: Setup test database
echo -e "\n${YELLOW}Setting up test database...${NC}"

# Export test environment variables
export NODE_ENV=test
export DATABASE_URL="postgresql://dhanam_test:test_password@localhost:5433/dhanam_test"
export REDIS_URL="redis://localhost:6379"
export JWT_SECRET="test-jwt-secret-key-very-long-string"
export JWT_ACCESS_EXPIRY="15m"
export JWT_REFRESH_EXPIRY="30d"
export ENCRYPTION_KEY="test-encryption-key-32-characters!"

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
pnpm prisma db push --force-reset

# Step 3: Run E2E tests
echo -e "\n${YELLOW}Running E2E tests...${NC}"

# Parse command line arguments
TEST_ARGS=""
COVERAGE=false

for arg in "$@"; do
    case $arg in
        --coverage)
            COVERAGE=true
            ;;
        *)
            TEST_ARGS="$TEST_ARGS $arg"
            ;;
    esac
done

# Run tests
if [ "$COVERAGE" = true ]; then
    echo -e "${YELLOW}Running tests with coverage...${NC}"
    pnpm jest --config ./test/jest-e2e.json --coverage $TEST_ARGS
else
    pnpm jest --config ./test/jest-e2e.json $TEST_ARGS
fi

# Capture exit code
TEST_EXIT_CODE=$?

# Step 4: Cleanup (optional)
if [ "$KEEP_DB" != "true" ]; then
    echo -e "\n${YELLOW}Cleaning up test database...${NC}"
    # Database cleanup is handled by the tests themselves
fi

# Step 5: Report results
echo -e "\n${YELLOW}Test Results:${NC}"
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ All E2E tests passed!${NC}"
else
    echo -e "${RED}✗ Some tests failed. Exit code: $TEST_EXIT_CODE${NC}"
fi

exit $TEST_EXIT_CODE
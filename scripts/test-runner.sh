#!/bin/bash

# Dhanam Test Runner Script
# Comprehensive test execution with proper setup and teardown

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
TEST_TYPE="all"
COVERAGE=false
WATCH=false
VERBOSE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --unit)
      TEST_TYPE="unit"
      shift
      ;;
    --e2e)
      TEST_TYPE="e2e"
      shift
      ;;
    --integration)
      TEST_TYPE="integration"
      shift
      ;;
    --coverage)
      COVERAGE=true
      shift
      ;;
    --watch)
      WATCH=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: ./test-runner.sh [--unit|--e2e|--integration] [--coverage] [--watch] [--verbose]"
      exit 1
      ;;
  esac
done

echo -e "${GREEN}🧪 Dhanam Test Runner${NC}"
echo "Test Type: $TEST_TYPE"
echo "Coverage: $COVERAGE"
echo "Watch: $WATCH"
echo ""

# Function to check if services are running
check_services() {
  echo -e "${YELLOW}Checking required services...${NC}"
  
  # Check PostgreSQL
  if ! nc -z localhost 5432 2>/dev/null; then
    echo -e "${RED}❌ PostgreSQL is not running on port 5432${NC}"
    echo "Please run: pnpm dev:infra"
    exit 1
  fi
  
  # Check Redis
  if ! nc -z localhost 6379 2>/dev/null; then
    echo -e "${RED}❌ Redis is not running on port 6379${NC}"
    echo "Please run: pnpm dev:infra"
    exit 1
  fi
  
  echo -e "${GREEN}✓ All required services are running${NC}"
}

# Function to run unit tests
run_unit_tests() {
  echo -e "${GREEN}Running unit tests...${NC}"
  
  if [ "$COVERAGE" = true ]; then
    pnpm --filter @dhanam/api test:cov
  elif [ "$WATCH" = true ]; then
    pnpm --filter @dhanam/api test:watch
  else
    pnpm --filter @dhanam/api test
  fi
  
  # Also run web unit tests
  echo -e "${GREEN}Running web unit tests...${NC}"
  pnpm --filter @dhanam/web test
}

# Function to run E2E tests
run_e2e_tests() {
  echo -e "${GREEN}Running E2E tests...${NC}"
  
  # Ensure services are running
  check_services
  
  # Run migrations
  echo -e "${YELLOW}Running database migrations...${NC}"
  pnpm --filter @dhanam/api db:push
  
  # Clear test database
  echo -e "${YELLOW}Clearing test database...${NC}"
  pnpm --filter @dhanam/api prisma:reset --skip-seed --force
  
  # Run E2E tests
  if [ "$COVERAGE" = true ]; then
    pnpm --filter @dhanam/api test:e2e:cov
  else
    pnpm --filter @dhanam/api test:e2e
  fi
}

# Function to run integration tests
run_integration_tests() {
  echo -e "${GREEN}Running integration tests...${NC}"
  
  # Ensure services are running
  check_services
  
  # Run specific integration test suites
  pnpm --filter @dhanam/api test:integration
}

# Function to generate coverage report
generate_coverage_report() {
  echo -e "${GREEN}Generating coverage report...${NC}"
  
  # Combine coverage from all test runs
  pnpm --filter @dhanam/api coverage:merge
  
  # Open coverage report in browser
  if command -v open &> /dev/null; then
    open apps/api/coverage/lcov-report/index.html
  elif command -v xdg-open &> /dev/null; then
    xdg-open apps/api/coverage/lcov-report/index.html
  fi
}

# Main execution
case $TEST_TYPE in
  unit)
    run_unit_tests
    ;;
  e2e)
    run_e2e_tests
    ;;
  integration)
    run_integration_tests
    ;;
  all)
    run_unit_tests
    echo ""
    run_e2e_tests
    echo ""
    if [ "$COVERAGE" = true ]; then
      generate_coverage_report
    fi
    ;;
esac

echo -e "${GREEN}✨ Test run complete!${NC}"

# Show test summary
if [ "$VERBOSE" = true ]; then
  echo ""
  echo "Test Summary:"
  echo "============="
  
  # Count test files
  UNIT_TESTS=$(find apps/api/src -name "*.spec.ts" | wc -l)
  E2E_TESTS=$(find apps/api/test/e2e -name "*.e2e-spec.ts" | wc -l)
  
  echo "Unit test files: $UNIT_TESTS"
  echo "E2E test files: $E2E_TESTS"
fi
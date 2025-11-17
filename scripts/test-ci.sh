#!/bin/bash
# Run tests locally with the same environment as CI
# Usage: ./scripts/test-ci.sh

set -e

echo "🧪 Running tests in CI mode..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
  exit 1
fi

echo "📦 Starting services..."
docker-compose -f infra/docker/docker-compose.yml up -d postgres redis

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Set test environment variables
export DATABASE_URL="postgresql://dhanam_user:dhanam_password@localhost:5432/dhanam_test"
export REDIS_URL="redis://localhost:6379"
export JWT_SECRET="test-jwt-secret-for-ci"
export JWT_REFRESH_SECRET="test-jwt-refresh-secret-for-ci"
export NODE_ENV="test"

echo ""
echo "🔧 Installing dependencies..."
pnpm install

echo ""
echo "🔄 Generating Prisma Client..."
cd apps/api
pnpm prisma generate

echo ""
echo "🗃️  Running migrations..."
pnpm prisma migrate deploy

echo ""
echo "✅ Linting code..."
cd ../..
pnpm lint

echo ""
echo "🧪 Running unit tests with coverage..."
cd apps/api
pnpm test:cov

echo ""
echo "📊 Coverage Summary:"
if [ -f coverage/coverage-summary.json ]; then
  cat coverage/coverage-summary.json | jq -r '.total | "Lines: \(.lines.pct)%", "Statements: \(.statements.pct)%", "Functions: \(.functions.pct)%", "Branches: \(.branches.pct)%"'
else
  echo "Coverage summary not found"
fi

echo ""
echo "🧪 Running E2E tests..."
pnpm test:e2e

echo ""
echo -e "${GREEN}✅ All tests passed!${NC}"

# Cleanup
echo ""
echo "🧹 Cleaning up..."
cd ../..
docker-compose -f infra/docker/docker-compose.yml down

echo ""
echo -e "${GREEN}🎉 CI simulation complete!${NC}"

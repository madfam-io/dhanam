#!/bin/bash

echo "Manual Dhanam Platform Start"
echo "============================"

# 1. Start Docker containers
echo "Starting Docker services..."
docker run -d --name dhanam-postgres \
    -e POSTGRES_USER=dhanam \
    -e POSTGRES_PASSWORD=localdev \
    -e POSTGRES_DB=dhanam \
    -p 5432:5432 \
    postgres:15-alpine 2>/dev/null || echo "Postgres already exists"

docker run -d --name dhanam-redis \
    -p 6379:6379 \
    redis:7-alpine 2>/dev/null || echo "Redis already exists"

# 2. Wait for services
echo "Waiting for services..."
sleep 5

# 3. Start API server
echo "Starting API server..."
cd apps/api
pnpm dev > ~/.dhanam/api.log 2>&1 &
echo $! > ~/.dhanam/api.pid
cd ../..

# 4. Start Web server
echo "Starting Web server..."
cd apps/web
pnpm dev > ~/.dhanam/web.log 2>&1 &
echo $! > ~/.dhanam/web.pid
cd ../..

echo ""
echo "Services starting..."
echo "Web UI will be available at: http://localhost:3000"
echo "API will be available at: http://localhost:4000"
echo ""
echo "Check logs:"
echo "  tail -f ~/.dhanam/web.log"
echo "  tail -f ~/.dhanam/api.log"
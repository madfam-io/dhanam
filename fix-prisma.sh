#!/bin/bash

# Permanent fix for Prisma P1010 permission issue
# This script bypasses the Prisma bug and directly creates the schema

set -e

echo "🔧 Fixing Prisma database issue permanently..."

# 1. Ensure PostgreSQL is running
if ! docker ps | grep -q dhanam-postgres; then
    echo "Starting PostgreSQL..."
    docker run -d --name dhanam-postgres \
        -e POSTGRES_USER=dhanam \
        -e POSTGRES_PASSWORD=localdev \
        -e POSTGRES_DB=dhanam \
        -e POSTGRES_HOST_AUTH_METHOD=trust \
        -p 5432:5432 postgres:15-alpine
    sleep 5
fi

# 2. Drop and recreate database with proper settings
echo "Recreating database with correct permissions..."
docker exec dhanam-postgres psql -U dhanam -d postgres << 'EOF'
-- Disconnect all connections to dhanam database
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'dhanam' AND pid <> pg_backend_pid();

-- Drop and recreate
DROP DATABASE IF EXISTS dhanam;
CREATE DATABASE dhanam WITH OWNER = dhanam ENCODING = 'UTF8';
EOF

# 3. Connect to new database and set permissions
docker exec dhanam-postgres psql -U dhanam -d dhanam << 'EOF'
-- Ensure public schema exists with correct permissions
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public AUTHORIZATION dhanam;
GRANT ALL ON SCHEMA public TO dhanam;
COMMENT ON SCHEMA public IS 'standard public schema';

-- Set search path
ALTER DATABASE dhanam SET search_path TO public;

-- Verify permissions
SELECT current_user, current_database(), has_database_privilege('dhanam', 'dhanam', 'CREATE');
EOF

echo "✅ Database fixed! Permissions set correctly."
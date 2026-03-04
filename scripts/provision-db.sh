#!/usr/bin/env bash
# Provision Dhanam database via Enclii API (idempotent — safe to re-run)
#
# Prerequisites:
#   ENCLII_API_URL    - Enclii switchyard-api URL (e.g. https://api.enclii.com)
#   ENCLII_ADMIN_TOKEN - Admin bearer token (obtain via: enclii auth login)
#   DB_PASSWORD        - Password for the dhanam_user role
#
# The endpoint checks pg_database/pg_roles before creating, so this is safe
# to run against an already-provisioned database. PgBouncer config is
# automatically updated by switchyard-api.
#
# Usage:
#   export ENCLII_API_URL=https://api.enclii.com
#   export ENCLII_ADMIN_TOKEN=$(enclii auth token)
#   export DB_PASSWORD=<secure-password>
#   ./scripts/provision-db.sh

set -euo pipefail

: "${ENCLII_API_URL:?Set ENCLII_API_URL (e.g. https://api.enclii.com)}"
: "${ENCLII_ADMIN_TOKEN:?Set ENCLII_ADMIN_TOKEN (enclii auth token)}"
: "${DB_PASSWORD:?Set DB_PASSWORD for the dhanam_user role}"

echo "Provisioning dhanam database via Enclii API..."

response=$(curl -sf -w "\n%{http_code}" -X POST \
  "${ENCLII_API_URL}/v1/admin/provision/postgres" \
  -H "Authorization: Bearer ${ENCLII_ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "namespace": "dhanam",
    "spec": {
      "database_name": "dhanam",
      "role_name": "dhanam_user",
      "role_password": "'"${DB_PASSWORD}"'",
      "extensions": ["uuid-ossp", "pgcrypto"]
    }
  }')

http_code=$(echo "$response" | tail -1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
  echo "Success (HTTP ${http_code}):"
  echo "$body"
else
  echo "Failed (HTTP ${http_code}):"
  echo "$body"
  exit 1
fi

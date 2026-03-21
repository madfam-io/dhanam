#!/usr/bin/env bash
set -euo pipefail

# Dhanam PostgreSQL Restore Script
# Usage: ./scripts/restore-db.sh <dump-file>
# Environment: DATABASE_URL (required)

DUMP_FILE="${1:-}"

if [ -z "$DUMP_FILE" ]; then
  echo "Usage: $0 <dump-file>"
  echo "Example: $0 /var/backups/dhanam/dhanam_2026-03-20_020000.dump"
  exit 1
fi

if [ ! -f "$DUMP_FILE" ]; then
  echo "❌ File not found: $DUMP_FILE"
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL is not set. Aborting."
  exit 1
fi

echo "⚠️  WARNING: This will drop and restore the database from:"
echo "   ${DUMP_FILE}"
echo ""
read -p "Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

echo "Restoring from ${DUMP_FILE}..."
pg_restore "$DATABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  --single-transaction \
  "$DUMP_FILE"

echo "✅ Restore complete. Run 'cd apps/api && npx prisma migrate deploy' to verify schema."

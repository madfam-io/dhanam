#!/usr/bin/env bash
set -euo pipefail

# Dhanam Database Restore Script
# Usage: ./restore.sh <backup_file.sql.gz>

BACKUP_FILE="${1:?Usage: restore.sh <backup_file.sql.gz>}"
DB_URL="${DATABASE_URL:?DATABASE_URL must be set}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "ERROR: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "WARNING: This will overwrite the current database!"
echo "Backup file: ${BACKUP_FILE}"
echo ""
read -p "Type 'RESTORE' to confirm: " CONFIRM

if [ "${CONFIRM}" != "RESTORE" ]; then
  echo "Restore cancelled."
  exit 0
fi

echo "[$(date)] Starting database restore from ${BACKUP_FILE}..."

gunzip -c "${BACKUP_FILE}" | psql "${DB_URL}"

echo "[$(date)] Restore complete. Verify data integrity."
echo "Recommended: Run 'pnpm prisma migrate deploy' to ensure schema is current."

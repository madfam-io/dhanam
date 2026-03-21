#!/usr/bin/env bash
set -euo pipefail

# Dhanam PostgreSQL Backup Script
# Usage: ./scripts/backup-db.sh
# Environment: DATABASE_URL (required), BACKUP_DIR, RETENTION_DAYS

BACKUP_DIR="${BACKUP_DIR:-/var/backups/dhanam}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
DUMP_FILE="${BACKUP_DIR}/dhanam_${TIMESTAMP}.dump"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL is not set. Aborting."
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "Starting backup to ${DUMP_FILE}..."
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-acl -f "$DUMP_FILE"

# Update latest symlink
ln -sf "$DUMP_FILE" "${BACKUP_DIR}/latest.dump"

echo "✅ Backup complete: ${DUMP_FILE} ($(du -h "$DUMP_FILE" | cut -f1))"

# Prune old backups
echo "Pruning backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "dhanam_*.dump" -mtime "+${RETENTION_DAYS}" -delete

echo "Done."

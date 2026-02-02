#!/usr/bin/env bash
set -euo pipefail

# Dhanam Database Backup Script
# Schedule: Daily via cron or K8s CronJob
# Retention: 30 days

BACKUP_DIR="${BACKUP_DIR:-/backups}"
DB_URL="${DATABASE_URL:?DATABASE_URL must be set}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/dhanam_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting database backup..."

# pg_dump with compression
pg_dump "${DB_URL}" --no-owner --no-privileges --clean --if-exists | gzip > "${BACKUP_FILE}"

FILESIZE=$(stat -f%z "${BACKUP_FILE}" 2>/dev/null || stat -c%s "${BACKUP_FILE}" 2>/dev/null)
echo "[$(date)] Backup completed: ${BACKUP_FILE} (${FILESIZE} bytes)"

# Upload to R2/S3 if configured
if [ -n "${R2_BACKUP_BUCKET:-}" ]; then
  aws s3 cp "${BACKUP_FILE}" "s3://${R2_BACKUP_BUCKET}/db-backups/$(basename ${BACKUP_FILE})" \
    --endpoint-url "${R2_ENDPOINT_URL}" 2>/dev/null && \
    echo "[$(date)] Uploaded to R2: ${R2_BACKUP_BUCKET}" || \
    echo "[$(date)] WARNING: R2 upload failed"
fi

# Cleanup old backups
echo "[$(date)] Cleaning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "dhanam_*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete 2>/dev/null || true

echo "[$(date)] Backup process complete"

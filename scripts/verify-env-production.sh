#!/usr/bin/env bash
# Guard: apps/web/.env.production must only contain NEXT_PUBLIC_* keys.
# Exit non-zero if any non-NEXT_PUBLIC key is present.
set -euo pipefail
FILE="${1:-apps/web/.env.production}"
if [ ! -f "$FILE" ]; then
  echo "OK (file missing): $FILE"
  exit 0
fi
bad=$(grep -vE '^\s*(#|$)' "$FILE" | grep -vE '^\s*NEXT_PUBLIC_' || true)
if [ -n "$bad" ]; then
  echo "::error::$FILE contains non-NEXT_PUBLIC keys:"
  echo "$bad"
  exit 1
fi
echo "OK: $FILE contains only NEXT_PUBLIC_* keys."

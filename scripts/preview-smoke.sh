#!/usr/bin/env bash
# P1.7 preview smoke test — hit a per-PR preview URL with the same
# 6x20s retry cadence used by staging. Usable from a developer laptop
# to probe a suspect preview, or from `enclii` CLI wrappers.
#
# Usage:
#   ./scripts/preview-smoke.sh <pr-number>
#   ./scripts/preview-smoke.sh 123
#
# Exits 0 on success, 1 on failure after 6 attempts. Echoes the URL
# being probed for clarity.
set -euo pipefail

PR="${1:-}"
if [[ -z "$PR" ]]; then
  echo "usage: $0 <pr-number>" >&2
  exit 2
fi
if ! [[ "$PR" =~ ^[0-9]+$ ]]; then
  echo "error: pr-number must be numeric, got '$PR'" >&2
  exit 2
fi

URL="https://pr-${PR}.api.preview.dhan.am"
echo "Probing $URL/health (6x retry, 20s apart)"
for i in 1 2 3 4 5 6; do
  if curl -fsS --max-time 10 "$URL/health" >/dev/null; then
    echo "OK (attempt $i)"
    exit 0
  fi
  echo "attempt $i unhealthy, retrying in 20s"
  sleep 20
done
echo "FAIL: $URL/health unhealthy after 6 attempts" >&2
echo "  - check ArgoCD:   argocd app get dhanam-pr-${PR}" >&2
echo "  - check ns:       kubectl -n dhanam-pr-${PR} get pods,events" >&2
echo "  - check ingress:  kubectl -n cloudflared logs -l app=cloudflared --tail=50 | grep pr-${PR}" >&2
exit 1

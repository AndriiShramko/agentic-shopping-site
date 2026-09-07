#!/usr/bin/env bash
# Site metrics from the first-party cookieless log (no cookies, no personal data).
# Usage: ops/stats.sh [days]   — runs over SSH on the hub, prints aggregated counters.
set -euo pipefail
DAYS="${1:-30}"
KEY="${ASA_SSH_KEY:-$HOME/.ssh/fpv_hetzner_key}"
ssh -p 2222 -i "$KEY" fpv@65.109.11.177 \
  "docker exec agentic-shopping-form python -c \"import urllib.request,json;print(json.dumps(json.load(urllib.request.urlopen('http://127.0.0.1:8089/api/stats?days=${DAYS}')),indent=1,ensure_ascii=False))\""

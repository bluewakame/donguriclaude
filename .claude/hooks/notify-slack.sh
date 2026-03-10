#!/usr/bin/env bash
set -euo pipefail

INPUT=$(cat)
STOP_REASON=$(echo "$INPUT" | jq -r '.stop_reason // "unknown"')

if [ "$STOP_REASON" = "end_turn" ] && [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
  curl -s -X POST "$SLACK_WEBHOOK_URL" \
    -H 'Content-Type: application/json' \
    -d '{"text":"Claude Code task completed"}' >/dev/null 2>&1 || true
fi

exit 0

#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

run() {
  printf "+ %s\n" "$*"
  "$@"
}

local_stack_ready() {
  local status_output
  local mailpit_url

  if ! status_output="$(supabase status --output env 2>/dev/null)"; then
    return 1
  fi

  mailpit_url="$(printf "%s\n" "$status_output" | sed -n "s/^MAILPIT_URL=//p" | tr -d "\"")"
  if [[ -z "$mailpit_url" ]]; then
    mailpit_url="$(printf "%s\n" "$status_output" | sed -n "s/^INBUCKET_URL=//p" | tr -d "\"")"
  fi

  if [[ -z "$mailpit_url" ]]; then
    return 1
  fi

  curl -fsS "${mailpit_url%/}/api/v1/messages?limit=1" >/dev/null
}

run pnpm --filter @lunav/contracts test
run pnpm --filter @lunav/web test
run pnpm --filter @lunav/web typecheck
run pnpm --filter @lunav/web lint
run pnpm --filter @lunav/web build
run pnpm security:client

if ! local_stack_ready; then
  echo "Local Supabase/Mailpit is unavailable. Start the Lunav stack before the browser E2E gate." >&2
  exit 1
fi

run pnpm --filter @lunav/web test:e2e

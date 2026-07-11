#!/usr/bin/env bash
set -euo pipefail

run() {
  printf '+ %s\n' "$*"
  "$@"
}

run pnpm --filter @lunav/contracts test
run pnpm --filter @lunav/web test
run pnpm --filter @lunav/mobile test
run pnpm test:auth-integration
run pnpm lint
run pnpm typecheck
run pnpm security:client
run pnpm --filter @lunav/mobile exec expo install --check

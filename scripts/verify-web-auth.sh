#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

run() {
  printf '+ %s\n' "$*"
  "$@"
}

run pnpm --filter @lunav/contracts test
run pnpm --filter @lunav/web test
run pnpm --filter @lunav/web typecheck
run pnpm --filter @lunav/web lint
run pnpm --filter @lunav/web build
run pnpm security:client

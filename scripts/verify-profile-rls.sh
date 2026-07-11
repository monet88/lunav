#!/usr/bin/env bash
set -euo pipefail

run() {
  printf '+ %s\n' "$*"
  "$@"
}

run pnpm --filter @lunav/contracts test
run pnpm --filter @lunav/contracts typecheck
run pnpm dlx supabase@2.109.1 db reset --local
run pnpm test:profile-integration
printf '+ %s\n' 'pnpm dlx supabase@2.109.1 gen types typescript --local'
pnpm dlx supabase@2.109.1 gen types typescript --local > /dev/null
run pnpm lint
run pnpm typecheck
run pnpm test
run pnpm security:client
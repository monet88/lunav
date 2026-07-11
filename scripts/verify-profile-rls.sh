#!/usr/bin/env bash
set -euo pipefail

run() {
  printf '+ %s\n' "$*"
  "$@"
}

project_id="$(sed -nE 's/^project_id[[:space:]]*=[[:space:]]*"([^"]+)"[[:space:]]*$/\1/p' supabase/config.toml)"

if [[ -z "$project_id" ]]; then
  printf 'Supabase project_id is required before resetting the profile database.\n' >&2
  exit 1
fi

realtime_container="supabase_realtime_${project_id}"
kong_container="supabase_kong_${project_id}"

if docker container inspect "$realtime_container" > /dev/null 2>&1; then
  run docker stop "$realtime_container" > /dev/null
fi

run pnpm dlx supabase@2.109.1 db reset --local

if docker container inspect "$kong_container" > /dev/null 2>&1; then
  run docker restart "$kong_container" > /dev/null
fi

run pnpm --filter @lunav/contracts test
run pnpm --filter @lunav/contracts typecheck
run pnpm test:profile-integration
printf '+ %s\n' 'pnpm dlx supabase@2.109.1 gen types typescript --local'
pnpm dlx supabase@2.109.1 gen types typescript --local > /dev/null
run pnpm lint
run pnpm typecheck
run pnpm test
run pnpm security:client
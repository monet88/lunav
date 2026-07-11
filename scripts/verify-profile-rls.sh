#!/usr/bin/env bash
set -euo pipefail

run() {
  printf '+ %s\n' "$*"
  "$@"
}

project_id="$(sed -nE 's/^project_id[[:space:]]*=[[:space:]]*"([^"]+)"[[:space:]]*$/\1/p' supabase/config.toml)"
api_port="$(sed -nE '/^\[api\][[:space:]]*$/,/^\[/{s/^port[[:space:]]*=[[:space:]]*([0-9]+)[[:space:]]*$/\1/p;}' supabase/config.toml)"

if [[ -z "$project_id" ]]; then
  printf 'Supabase project_id is required before resetting the profile database.\n' >&2
  exit 1
fi

if [[ -z "$api_port" ]]; then
  printf 'Supabase API port is required before verifying Kong readiness.\n' >&2
  exit 1
fi

realtime_container="supabase_realtime_${project_id}"
kong_container="supabase_kong_${project_id}"
auth_health_url="http://127.0.0.1:${api_port}/auth/v1/health"
auth_health_max_attempts=20

if docker container inspect "$realtime_container" > /dev/null 2>&1; then
  run docker stop "$realtime_container" > /dev/null
fi

run pnpm dlx supabase@2.109.1 db reset --local

if docker container inspect "$kong_container" > /dev/null 2>&1; then
  run docker restart "$kong_container" > /dev/null

  auth_ready=0
  for ((attempt = 1; attempt <= auth_health_max_attempts; attempt++)); do
    if curl --fail --silent --show-error --max-time 2 "$auth_health_url" > /dev/null; then
      auth_ready=1
      break
    fi

    if ((attempt < auth_health_max_attempts)); then
      sleep 0.5
    fi
  done

  if ((auth_ready == 0)); then
    printf 'Local Auth did not become ready through Kong after %s attempts.\n' \
      "$auth_health_max_attempts" >&2
    exit 1
  fi
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
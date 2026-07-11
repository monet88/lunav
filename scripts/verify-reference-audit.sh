#!/usr/bin/env bash
set -euo pipefail

reference_root="${1:-/f/CodeBase/ziweiai-web}"

required_evidence=(
  'PRODUCT.md'
  'packages/contracts/src/chart/birth-input.ts'
  'packages/contracts/src/chart/chart-snapshot.ts'
  'packages/astro-engine/src/server-only.ts'
  'packages/astro-engine/src/fixtures/phase-3-fixture-catalog.ts'
  'apps/api/src/modules/charts/charts.controller.ts'
  'apps/api/src/modules/explanations/explanations.controller.ts'
  'apps/api/src/modules/conversations/conversations.controller.ts'
)

if [[ ! -e "${reference_root}" ]]; then
  printf 'Reference repository not found: %s\n' "${reference_root}" >&2
  exit 1
fi

missing_evidence=()
for relative_path in "${required_evidence[@]}"; do
  if [[ ! -e "${reference_root}/${relative_path}" ]]; then
    missing_evidence+=("${relative_path}")
  fi
done

if ((${#missing_evidence[@]} > 0)); then
  printf 'Missing reference evidence: %s\n' "$(IFS=', '; echo "${missing_evidence[*]}")" >&2
  exit 1
fi

printf 'Reference audit verification passed (%s paths).\n' "${#required_evidence[@]}"

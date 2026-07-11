#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'EOF'
Usage:
  bash scripts/verify-reference-audit.sh <ref-root>
  REFERENCE_REPO_ROOT=<ref-root> bash scripts/verify-reference-audit.sh

Checks that the Phase 0 reference repository contains the required evidence
files. The reference root must be supplied as the first argument or via the
REFERENCE_REPO_ROOT environment variable. There is no machine-specific default.
EOF
}

reference_root="${1:-${REFERENCE_REPO_ROOT:-}}"

if [[ -z "${reference_root}" ]]; then
  usage
  exit 1
fi

if [[ ! -d "${reference_root}" ]]; then
  printf 'Reference repository not found: %s\n' "${reference_root}" >&2
  exit 1
fi

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

missing_evidence=()
for relative_path in "${required_evidence[@]}"; do
  candidate="${reference_root}/${relative_path}"
  if [[ ! -f "${candidate}" || ! -r "${candidate}" ]]; then
    missing_evidence+=("${relative_path}")
  fi
done

if ((${#missing_evidence[@]} > 0)); then
  printf 'Missing reference evidence: %s\n' "$(IFS=', '; echo "${missing_evidence[*]}")" >&2
  exit 1
fi

printf 'Reference audit verification passed (%s paths).\n' "${#required_evidence[@]}"

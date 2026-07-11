#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

required_files=(
  'SPEC.md'
  'docs/PRODUCT_SCOPE.md'
  'docs/REFERENCE_AUDIT.md'
  'docs/INVARIANTS.md'
  'docs/HARNESS.md'
  'docs/FEATURE_INTAKE.md'
  'docs/ARCHITECTURE.md'
  'docs/CONTEXT_RULES.md'
  'docs/TOOL_REGISTRY.md'
  'docs/spec-intake/2026-07-10-ziwei-ai-roadmap.md'
  'docs/decisions/0001-clean-room-vietnamese-first-foundation.md'
  'docs/stories/US-001-phase-0-reference-audit/overview.md'
  'docs/stories/US-001-phase-0-reference-audit/design.md'
  'docs/stories/US-001-phase-0-reference-audit/validation.md'
  'docs/stories/US-001-phase-0-reference-audit/execplan.md'
  'scripts/verify-reference-audit.ps1'
  'scripts/verify-reference-audit.sh'
  'scripts/verify-phase0.ps1'
  'scripts/verify-phase0.sh'
)

missing_files=()
for relative_path in "${required_files[@]}"; do
  if [[ ! -e "${repo_root}/${relative_path}" ]]; then
    missing_files+=("${relative_path}")
  fi
done

if ((${#missing_files[@]} > 0)); then
  printf 'Missing Phase 0 files: %s\n' "$(IFS=', '; echo "${missing_files[*]}")" >&2
  exit 1
fi

placeholder_hits=()
while IFS= read -r hit; do
  [[ -n "${hit}" ]] && placeholder_hits+=("${hit}")
done < <(
  for relative_path in "${required_files[@]}"; do
    if [[ "${relative_path}" == *.md ]]; then
      # Match the PowerShell verifier's case-insensitive whole-word scan.
      grep -nEi '\b(TBD|TODO|PLACEHOLDER)\b' "${repo_root}/${relative_path}" \
        | sed "s|^|${repo_root}/${relative_path}:|" || true
    fi
  done
)

if ((${#placeholder_hits[@]} > 0)); then
  printf 'Unresolved placeholders found: %s\n' "$(IFS=', '; echo "${placeholder_hits[*]}")" >&2
  exit 1
fi

check_phrases() {
  local relative_path="$1"
  shift
  local content
  content="$(<"${repo_root}/${relative_path}")"
  local missing=()
  local phrase
  for phrase in "$@"; do
    if [[ "${content}" != *"${phrase}"* ]]; then
      missing+=("${phrase}")
    fi
  done
  if ((${#missing[@]} > 0)); then
    printf '%s is missing required phrases: %s\n' \
      "${relative_path}" \
      "$(IFS=', '; echo "${missing[*]}")" >&2
    exit 1
  fi
}

check_phrases 'docs/PRODUCT_SCOPE.md' \
  'interested in understanding' \
  'Vietnamese-first' \
  'locale' \
  'semantic'

check_phrases 'docs/REFERENCE_AUDIT.md' \
  'clean-room' \
  'server-only' \
  'fixture' \
  'Architecture Mistakes Not to Repeat'

check_phrases 'docs/INVARIANTS.md' \
  'Contracts First' \
  'Server-Only Privileged Logic' \
  'Vietnamese-First, Locale-Ready' \
  'Idempotency and Retry'

check_phrases 'docs/ARCHITECTURE.md' \
  'target architecture' \
  'Next.js App Router' \
  'Expo Router' \
  'Supabase Auth' \
  'Row Level Security'

spec_content="$(<"${repo_root}/SPEC.md")"
for deliverable in \
  'docs/REFERENCE_AUDIT.md' \
  'docs/PRODUCT_SCOPE.md' \
  'docs/INVARIANTS.md'
do
  if [[ "${spec_content}" != *"${deliverable}"* ]]; then
    printf 'SPEC.md does not declare Phase 0 deliverable %s\n' "${deliverable}" >&2
    exit 1
  fi
done

echo 'Phase 0 verification passed.'

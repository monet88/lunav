#!/usr/bin/env bash
set -euo pipefail

story_id="${1:-}"
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

case "${story_id}" in
  US-004|US-005|US-006|US-007|US-008) ;;
  *)
    printf 'Usage: %s <US-004|US-005|US-006|US-007|US-008>\n' "$0" >&2
    exit 1
    ;;
esac

declare -A story_folders=(
  ['US-004']='docs/stories/US-004-auth-user-epic'
  ['US-005']='docs/stories/US-005-auth-session-identity'
  ['US-006']='docs/stories/US-006-profile-persistence-rls'
  ['US-007']='docs/stories/US-007-web-auth-account'
  ['US-008']='docs/stories/US-008-mobile-auth-account'
)

required_story_files=('overview.md' 'design.md' 'validation.md' 'execplan.md')
story_folder="${repo_root}/${story_folders[${story_id}]}"

for file_name in "${required_story_files[@]}"; do
  path="${story_folder}/${file_name}"
  if [[ ! -e "${path}" ]]; then
    printf 'Missing required story artifact: %s\n' "${path}" >&2
    exit 1
  fi
done

if [[ "${story_id}" == 'US-004' ]]; then
  required_epic_files=(
    'docs/superpowers/specs/2026-07-10-auth-user-epic-design.md'
    'docs/superpowers/plans/2026-07-10-auth-user-epic.md'
  )
  for relative_path in "${required_epic_files[@]}"; do
    path="${repo_root}/${relative_path}"
    if [[ ! -e "${path}" ]]; then
      printf 'Missing required epic artifact: %s\n' "${path}" >&2
      exit 1
    fi
  done
fi

overview="$(<"${story_folder}/overview.md")"
if [[ "${overview}" != *'high-risk'* ]]; then
  printf '%s must remain in the high-risk lane\n' "${story_id}" >&2
  exit 1
fi

packet=''
for file_name in "${required_story_files[@]}"; do
  packet+="$(<"${story_folder}/${file_name}")"$'\n'
done

declare -A required_markers_csv=(
  ['US-004']='US-005|US-006|US-007|US-008|exclusive ownership'
  ['US-005']='apps/web/proxy.ts|email confirmation|canonical pathname|cleanup'
  ['US-006']='UPDATE (display_name)|auth.uid()|cross-user|updated_at'
  ['US-007']='enumeration-safe|replayed|secure cookie|verified user'
  ['US-008']='Android App Links|assetlinks.json|replayed|Android emulator'
)

IFS='|' read -r -a markers <<< "${required_markers_csv[${story_id}]}"
for marker in "${markers[@]}"; do
  if [[ "${packet}" != *"${marker}"* ]]; then
    printf '%s planning packet is missing required marker: %s\n' "${story_id}" "${marker}" >&2
    exit 1
  fi
done

planning_boundary='This planning verifier authorizes scheduling, not implementation completion.'
if [[ "${packet}" != *"${planning_boundary}"* ]]; then
  printf '%s planning packet does not protect the planning/implementation proof boundary\n' "${story_id}" >&2
  exit 1
fi

printf '%s planning packet verified\n' "${story_id}"

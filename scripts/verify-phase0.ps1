$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot

$requiredFiles = @(
    'SPEC.md',
    'docs/PRODUCT_SCOPE.md',
    'docs/REFERENCE_AUDIT.md',
    'docs/INVARIANTS.md',
    'docs/HARNESS.md',
    'docs/FEATURE_INTAKE.md',
    'docs/ARCHITECTURE.md',
    'docs/CONTEXT_RULES.md',
    'docs/TOOL_REGISTRY.md',
    'docs/spec-intake/2026-07-10-ziwei-ai-roadmap.md',
    'docs/decisions/0001-clean-room-vietnamese-first-foundation.md',
    'docs/stories/US-001-phase-0-reference-audit/overview.md',
    'docs/stories/US-001-phase-0-reference-audit/design.md',
    'docs/stories/US-001-phase-0-reference-audit/validation.md',
    'docs/stories/US-001-phase-0-reference-audit/execplan.md',
    'docs/stories/US-002-harness-changeset-sync.md',
    'scripts/verify-reference-audit.ps1',
    'scripts/test-verify-harness-sync.ps1',
    'scripts/verify-harness-sync.ps1',
    '.harness/changesets/SHA256SUMS',
    '.harness/changesets/phase0-baseline.changeset.jsonl',
    '.harness/changesets/phase0-harness-sync.changeset.jsonl',
    '.harness/changesets/phase0-z-harness-sync-review.changeset.jsonl',
    '.harness/changesets/phase0-zz-harness-sync-validation.changeset.jsonl'
)

$missingFiles = $requiredFiles | Where-Object {
    -not (Test-Path (Join-Path $repoRoot $_))
}

if ($missingFiles.Count -gt 0) {
    throw "Missing Phase 0 files: $($missingFiles -join ', ')"
}

$contractFiles = $requiredFiles | Where-Object { $_ -like '*.md' } | ForEach-Object {
    Join-Path $repoRoot $_
}

$placeholderMatches = Select-String -Path $contractFiles -Pattern '\b(TBD|TODO|PLACEHOLDER)\b' -CaseSensitive:$false
if ($placeholderMatches) {
    $locations = $placeholderMatches | ForEach-Object { "$($_.Path):$($_.LineNumber)" }
    throw "Unresolved placeholders found: $($locations -join ', ')"
}

$requiredPhrases = @{
    'docs/PRODUCT_SCOPE.md' = @('interested in understanding', 'Vietnamese-first', 'locale', 'semantic')
    'docs/REFERENCE_AUDIT.md' = @('clean-room', 'server-only', 'fixture', 'Architecture Mistakes Not to Repeat')
    'docs/INVARIANTS.md' = @('Contracts First', 'Server-Only Privileged Logic', 'Vietnamese-First, Locale-Ready', 'Idempotency and Retry')
    'docs/ARCHITECTURE.md' = @('target architecture', 'Next.js App Router', 'Expo Router', 'Convex', 'Clerk')
}

foreach ($entry in $requiredPhrases.GetEnumerator()) {
    $content = Get-Content -Raw (Join-Path $repoRoot $entry.Key)
    $missingPhrases = $entry.Value | Where-Object { -not $content.Contains($_) }
    if ($missingPhrases.Count -gt 0) {
        throw "$($entry.Key) is missing required phrases: $($missingPhrases -join ', ')"
    }
}

$spec = Get-Content -Raw (Join-Path $repoRoot 'SPEC.md')
foreach ($deliverable in @('docs/REFERENCE_AUDIT.md', 'docs/PRODUCT_SCOPE.md', 'docs/INVARIANTS.md')) {
    if (-not $spec.Contains($deliverable)) {
        throw "SPEC.md does not declare Phase 0 deliverable $deliverable"
    }
}

& (Join-Path $repoRoot 'scripts/verify-harness-sync.ps1')
if ($LASTEXITCODE -ne 0) {
    throw 'Harness synchronization verification failed.'
}

& (Join-Path $repoRoot 'scripts/test-verify-harness-sync.ps1')
if ($LASTEXITCODE -ne 0) {
    throw 'Harness synchronization regression verification failed.'
}

Write-Output 'Phase 0 verification passed.'
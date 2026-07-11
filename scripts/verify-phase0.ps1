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
    'scripts/verify-reference-audit.ps1',
    'scripts/verify-reference-audit.sh',
    'scripts/verify-phase0.ps1',
    'scripts/verify-phase0.sh'
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
    'docs/ARCHITECTURE.md' = @('target architecture', 'Next.js App Router', 'Expo Router', 'Supabase Auth', 'Row Level Security')
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

Write-Output 'Phase 0 verification passed.'
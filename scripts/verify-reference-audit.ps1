param(
    [string]$ReferenceRoot = $env:REFERENCE_REPO_ROOT
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($ReferenceRoot)) {
    throw @"
Usage:
  .\scripts\verify-reference-audit.ps1 -ReferenceRoot <ref-root>
  `$env:REFERENCE_REPO_ROOT = '<ref-root>'; .\scripts\verify-reference-audit.ps1

The reference root must be supplied as -ReferenceRoot or REFERENCE_REPO_ROOT.
There is no machine-specific default.
"@
}

$requiredEvidence = @(
    'PRODUCT.md',
    'packages/contracts/src/chart/birth-input.ts',
    'packages/contracts/src/chart/chart-snapshot.ts',
    'packages/astro-engine/src/server-only.ts',
    'packages/astro-engine/src/fixtures/phase-3-fixture-catalog.ts',
    'apps/api/src/modules/charts/charts.controller.ts',
    'apps/api/src/modules/explanations/explanations.controller.ts',
    'apps/api/src/modules/conversations/conversations.controller.ts'
)

if (-not (Test-Path -LiteralPath $ReferenceRoot -PathType Container)) {
    throw "Reference repository not found: $ReferenceRoot"
}

$missingEvidence = @()
$unreadableEvidence = @()

foreach ($relativePath in $requiredEvidence) {
    $candidate = Join-Path $ReferenceRoot $relativePath
    if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
        $missingEvidence += $relativePath
        continue
    }

    try {
        $stream = [System.IO.File]::OpenRead($candidate)
        $stream.Dispose()
    } catch {
        $unreadableEvidence += $relativePath
    }
}

if ($missingEvidence.Count -gt 0) {
    throw "Missing reference evidence: $($missingEvidence -join ', ')"
}

if ($unreadableEvidence.Count -gt 0) {
    throw "Unreadable reference evidence: $($unreadableEvidence -join ', ')"
}

Write-Output "Reference audit verification passed ($($requiredEvidence.Count) paths)."

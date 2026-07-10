param(
    [string]$ReferenceRoot = 'F:\CodeBase\ziweiai-web'
)

$ErrorActionPreference = 'Stop'

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

if (-not (Test-Path $ReferenceRoot)) {
    throw "Reference repository not found: $ReferenceRoot"
}

$missingEvidence = $requiredEvidence | Where-Object {
    -not (Test-Path (Join-Path $ReferenceRoot $_))
}

if ($missingEvidence.Count -gt 0) {
    throw "Missing reference evidence: $($missingEvidence -join ', ')"
}

Write-Output "Reference audit verification passed ($($requiredEvidence.Count) paths)."
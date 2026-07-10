param(
    [string]$ChangesetDirectory = (Join-Path (Split-Path -Parent $PSScriptRoot) '.harness\changesets'),
    [switch]$SkipLocalParity
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$cli = Join-Path $repoRoot 'scripts\bin\harness-cli.exe'
$tempDb = Join-Path $env:TEMP "lunav-harness-sync-$([guid]::NewGuid().ToString('N')).db"
$manifestPath = Join-Path $ChangesetDirectory 'SHA256SUMS'
$realSyncVerifyCommand = 'powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-harness-sync.ps1 -SkipLocalParity'
$phase0VerifyCommand = 'powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-phase0.ps1'
$hadHarnessDbPath = Test-Path Env:HARNESS_DB_PATH
$originalHarnessDbPath = $env:HARNESS_DB_PATH

function Get-HarnessScalar {
    param([string]$Query)

    $output = & $cli query sql $Query
    if ($LASTEXITCODE -ne 0) {
        throw "Harness scalar query failed: $Query"
    }

    $value = $output | Where-Object { $_ -match '^\s*\d+\s*$' } | Select-Object -Last 1
    if ($null -eq $value) {
        throw "Harness scalar query returned no numeric value: $Query"
    }

    return [int]$value.Trim()
}

function Get-FileSha256 {
    param([string]$Path)

    $stream = [System.IO.File]::OpenRead($Path)
    try {
        $sha256 = [System.Security.Cryptography.SHA256]::Create()
        try {
            $hashBytes = $sha256.ComputeHash($stream)
            return ([System.BitConverter]::ToString($hashBytes) -replace '-', '').ToLowerInvariant()
        }
        finally {
            $sha256.Dispose()
        }
    }
    finally {
        $stream.Dispose()
    }
}

function Get-HarnessSnapshot {
    param([switch]$ExcludeVerificationResults)

    $storyVerificationColumn = if ($ExcludeVerificationResults) { '' } else { ', last_verified_result' }
    $decisionVerificationColumn = if ($ExcludeVerificationResults) { '' } else { ', last_verified_result' }
    $queries = @(
        'SELECT id, input_type, summary, risk_lane, risk_flags, affected_docs, story_id, notes FROM intake ORDER BY id',
        "SELECT id, title, risk_lane, contract_doc, status, unit_proof, integration_proof, e2e_proof, platform_proof, evidence, notes, verify_command$storyVerificationColumn FROM story ORDER BY id",
        "SELECT id, title, status, doc_path, verify_command$decisionVerificationColumn, predicted_impact, actual_outcome, notes FROM decision ORDER BY id",
        'SELECT id, title, discovered_while, current_pain, suggested_improvement, risk, status, predicted_impact, actual_outcome, notes FROM backlog ORDER BY id',
        'SELECT id, task_summary, intake_id, story_id, agent, actions_taken, files_read, files_changed, decisions_made, errors, outcome, duration_seconds, token_estimate, harness_friction, notes FROM trace ORDER BY id',
        'SELECT name, provider, command, description, args, responsibility, since, kind, capability, scan_target, status FROM tool ORDER BY name',
        'SELECT id, trace_id, story_id, type, description, source, impact FROM intervention ORDER BY id',
        'SELECT story_id, blocks_story_id FROM story_dependency ORDER BY story_id, blocks_story_id',
        'SELECT parent_story_id, child_story_id FROM story_hierarchy ORDER BY parent_story_id, child_story_id',
        'SELECT id FROM changeset_applied ORDER BY id'
    )

    $sections = foreach ($query in $queries) {
        $output = & $cli query sql $query
        if ($LASTEXITCODE -ne 0) {
            throw "Harness snapshot query failed: $query"
        }

        "$query`n$($output -join "`n")"
    }

    return $sections -join "`n---`n"
}

if (-not (Test-Path $cli)) {
    throw "Harness CLI not found: $cli"
}

if (-not (Test-Path $ChangesetDirectory)) {
    throw "Harness changeset directory not found: $ChangesetDirectory"
}

if (-not (Test-Path $manifestPath)) {
    throw "Harness changeset checksum manifest not found: $manifestPath"
}

$changesetFiles = @(Get-ChildItem $ChangesetDirectory -Filter '*.changeset.jsonl' | Sort-Object Name)
if ($changesetFiles.Count -eq 0) {
    throw "No Harness changesets found in: $ChangesetDirectory"
}

$manifestEntries = @{}
foreach ($line in Get-Content $manifestPath | Where-Object { $_.Trim() }) {
    if ($line -notmatch '^([0-9a-fA-F]{64})\s{2}(.+\.changeset\.jsonl)$') {
        throw "Invalid Harness checksum manifest line: $line"
    }

    $manifestEntries[$Matches[2]] = $Matches[1].ToLowerInvariant()
}

if ($manifestEntries.Count -ne $changesetFiles.Count) {
    throw "Expected $($changesetFiles.Count) checksum entries, found $($manifestEntries.Count)."
}

foreach ($changesetFile in $changesetFiles) {
    $records = @(Get-Content $changesetFile.FullName | Where-Object { $_.Trim() } | ForEach-Object { $_ | ConvertFrom-Json })
    if ($records.Count -eq 0 -or $records[0].op -ne 'changeset.header') {
        throw "Harness changeset does not start with a header: $($changesetFile.FullName)"
    }

    $expectedRunId = $changesetFile.Name -replace '\.changeset\.jsonl$', ''
    if ($records[0].run_id -ne $expectedRunId) {
        throw "Harness changeset filename does not match header run_id: $($changesetFile.Name)"
    }

    if (-not $manifestEntries.ContainsKey($changesetFile.Name)) {
        throw "Harness checksum manifest is missing: $($changesetFile.Name)"
    }

    $actualHash = Get-FileSha256 $changesetFile.FullName
    if ($actualHash -ne $manifestEntries[$changesetFile.Name]) {
        throw "Harness changeset checksum mismatch: $($changesetFile.Name)"
    }
}

$env:HARNESS_DB_PATH = $tempDb

try {
    & $cli db rebuild --from $ChangesetDirectory
    if ($LASTEXITCODE -ne 0) {
        throw 'Harness database rebuild failed.'
    }

    $requiredInvariants = @(
        @{
            Name = 'US-001 Phase 0 story'
            Query = "SELECT COUNT(*) AS value FROM story WHERE id = 'US-001' AND status = 'in_progress' AND unit_proof = 1 AND integration_proof = 1 AND e2e_proof = 0 AND platform_proof = 0 AND verify_command = '$phase0VerifyCommand' AND last_verified_result = 'pass'"
        },
        @{
            Name = 'US-002 Harness synchronization story'
            Query = "SELECT COUNT(*) AS value FROM story WHERE id = 'US-002' AND status = 'implemented' AND unit_proof = 1 AND integration_proof = 1 AND e2e_proof = 0 AND platform_proof = 1 AND verify_command = '$realSyncVerifyCommand' AND last_verified_result = 'pass'"
        },
        @{
            Name = 'Phase 0 architecture decision'
            Query = "SELECT COUNT(*) AS value FROM decision WHERE id = '0001-clean-room-vietnamese-first-foundation' AND title = 'Clean-Room, Vietnamese-First Foundation' AND status = 'accepted' AND doc_path = 'docs/decisions/0001-clean-room-vietnamese-first-foundation.md'"
        },
        @{
            Name = 'US-001 intake provenance'
            Query = "SELECT COUNT(*) AS value FROM intake WHERE id = 1 AND story_id = 'US-001' AND input_type = 'new_spec' AND risk_lane = 'high_risk'"
        },
        @{
            Name = 'US-002 intake provenance'
            Query = "SELECT COUNT(*) AS value FROM intake WHERE id = 2 AND story_id = 'US-002' AND input_type = 'harness_improvement' AND risk_lane = 'normal'"
        },
        @{
            Name = 'US-001 execution trace'
            Query = "SELECT COUNT(*) AS value FROM trace WHERE id = 1 AND intake_id = 1 AND story_id = 'US-001' AND outcome = 'partial' AND task_summary = 'Prepared the review-ready ZIWEI AI Phase 0 clean-room product contract and Harness story'"
        },
        @{
            Name = 'US-002 implementation trace'
            Query = "SELECT COUNT(*) AS value FROM trace WHERE id = 2 AND intake_id = 2 AND story_id = 'US-002' AND outcome = 'completed' AND task_summary = 'Added changeset-based Harness synchronization and fresh-database verification'"
        },
        @{
            Name = 'US-002 hardening trace'
            Query = "SELECT COUNT(*) AS value FROM trace WHERE id = 3 AND intake_id = 2 AND story_id = 'US-002' AND outcome = 'completed' AND task_summary = 'Hardened Harness synchronization verification for future changesets'"
        },
        @{
            Name = 'US-002 regression trace'
            Query = "SELECT COUNT(*) AS value FROM trace WHERE id = 4 AND intake_id = 2 AND story_id = 'US-002' AND outcome = 'completed' AND task_summary = 'Validated Harness synchronization provenance and regression cases'"
        }
    )

    foreach ($invariant in $requiredInvariants) {
        $matchCount = Get-HarnessScalar $invariant.Query
        if ($matchCount -ne 1) {
            throw "Rebuilt Harness database is missing required invariant: $($invariant.Name)"
        }
    }

    $snapshotBeforeReapply = Get-HarnessSnapshot

    foreach ($changesetFile in $changesetFiles) {
        & $cli db changeset apply $changesetFile.FullName
        if ($LASTEXITCODE -ne 0) {
            throw "Reapplying the changeset was not idempotent: $($changesetFile.Name)"
        }
    }

    $appliedChangesetCount = Get-HarnessScalar 'SELECT COUNT(*) AS value FROM changeset_applied'
    if ($appliedChangesetCount -ne $changesetFiles.Count) {
        throw "Expected $($changesetFiles.Count) applied changeset(s), found $appliedChangesetCount."
    }

    $snapshotAfterReapply = Get-HarnessSnapshot
    if ($snapshotAfterReapply -ne $snapshotBeforeReapply) {
        throw 'Reapplying Harness changesets modified durable semantic state.'
    }

    if (-not $SkipLocalParity) {
        $localDb = Join-Path $repoRoot 'harness.db'
        if (Test-Path $localDb) {
            $freshSnapshot = Get-HarnessSnapshot -ExcludeVerificationResults
            $env:HARNESS_DB_PATH = $localDb
            $localSnapshot = Get-HarnessSnapshot -ExcludeVerificationResults
            if ($localSnapshot -ne $freshSnapshot) {
                throw 'Local harness.db semantic state does not match a fresh changeset rebuild.'
            }
            $env:HARNESS_DB_PATH = $tempDb
        }
    }

    Write-Output 'Harness changeset synchronization verification passed.'
}
finally {
    if ($hadHarnessDbPath) {
        $env:HARNESS_DB_PATH = $originalHarnessDbPath
    }
    else {
        Remove-Item Env:HARNESS_DB_PATH -ErrorAction SilentlyContinue
    }
    Remove-Item $tempDb, "$tempDb-wal", "$tempDb-shm" -Force -ErrorAction SilentlyContinue
}
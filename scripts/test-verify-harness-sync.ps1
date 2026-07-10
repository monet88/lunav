$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$changesetSource = Join-Path $repoRoot '.harness\changesets'
$verifier = Join-Path $PSScriptRoot 'verify-harness-sync.ps1'

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

function Set-Utf8NoBom {
    param(
        [string]$Path,
        [string[]]$Lines
    )

    $encoding = New-Object System.Text.UTF8Encoding -ArgumentList $false
    [System.IO.File]::WriteAllLines($Path, $Lines, $encoding)
}

function Write-ChangesetManifest {
    param([string]$Directory)

    $entries = Get-ChildItem $Directory -Filter '*.changeset.jsonl' |
        Sort-Object Name |
        ForEach-Object {
            $hash = Get-FileSha256 $_.FullName
            "$hash  $($_.Name)"
        }

    Set-Utf8NoBom -Path (Join-Path $Directory 'SHA256SUMS') -Lines $entries
}

function Invoke-VerificationCase {
    param(
        [string]$Name,
        [bool]$ShouldPass,
        [scriptblock]$Mutate
    )

    $fixture = Join-Path $env:TEMP "lunav-harness-sync-test-$([guid]::NewGuid().ToString('N'))"
    New-Item -ItemType Directory -Path $fixture | Out-Null
    Copy-Item (Join-Path $changesetSource '*') $fixture -Recurse

    try {
        if ($null -ne $Mutate) {
            & $Mutate $fixture
        }

        Write-ChangesetManifest $fixture
        $previousErrorActionPreference = $ErrorActionPreference
        try {
            $ErrorActionPreference = 'Continue'
            $output = & powershell -NoProfile -ExecutionPolicy Bypass -File $verifier `
                -ChangesetDirectory $fixture -SkipLocalParity 2>&1
            $exitCode = $LASTEXITCODE
        }
        finally {
            $ErrorActionPreference = $previousErrorActionPreference
        }

        if ($ShouldPass -and $exitCode -ne 0) {
            throw "Expected '$Name' to pass, but it failed:`n$($output -join "`n")"
        }

        if (-not $ShouldPass -and $exitCode -eq 0) {
            throw "Expected '$Name' to fail, but it passed."
        }

        Write-Output "PASS: $Name"
    }
    finally {
        Remove-Item $fixture -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Invoke-VerificationCase -Name 'valid changesets' -ShouldPass $true

Invoke-VerificationCase -Name 'missing intake and trace provenance' -ShouldPass $false -Mutate {
    param($fixture)

    Get-ChildItem $fixture -Filter '*.changeset.jsonl' | ForEach-Object {
        $retainedLines = Get-Content $_.FullName | Where-Object {
            $record = $_ | ConvertFrom-Json
            $record.op -notin @('intake.add', 'trace.add')
        }
        Set-Utf8NoBom -Path $_.FullName -Lines $retainedLines
    }
}

Invoke-VerificationCase -Name 'later no-op verification command' -ShouldPass $false -Mutate {
    param($fixture)

    $lines = @(
        '{"base_schema_version":8,"op":"changeset.header","run_id":"zzzz-noop","version":1}',
        '{"id":"US-002","op":"story.update","payload":{"e2e_proof":null,"evidence":null,"integration_proof":null,"platform_proof":null,"status":null,"unit_proof":null,"verify_command":"cmd /c exit 0"},"version":1}'
    )
    Set-Utf8NoBom -Path (Join-Path $fixture 'zzzz-noop.changeset.jsonl') -Lines $lines
}

Invoke-VerificationCase -Name 'incorrect US-002 proof tuple' -ShouldPass $false -Mutate {
    param($fixture)

    $lines = @(
        '{"base_schema_version":8,"op":"changeset.header","run_id":"zzzz-proof-drift","version":1}',
        '{"id":"US-002","op":"story.update","payload":{"e2e_proof":1,"evidence":null,"integration_proof":null,"platform_proof":null,"status":null,"unit_proof":null,"verify_command":null},"version":1}'
    )
    Set-Utf8NoBom -Path (Join-Path $fixture 'zzzz-proof-drift.changeset.jsonl') -Lines $lines
}

Invoke-VerificationCase -Name 'additional valid changeset' -ShouldPass $true -Mutate {
    param($fixture)

    $lines = @(
        '{"base_schema_version":8,"op":"changeset.header","run_id":"zzzz-future-decision","version":1}',
        '{"id":"0099-future-compatible-proof","op":"decision.add","payload":{"doc_path":null,"notes":"Regression fixture for future-compatible changeset counts.","predicted_impact":null,"status":"proposed","title":"Future-compatible verifier fixture","verify_command":null},"version":1}'
    )
    Set-Utf8NoBom -Path (Join-Path $fixture 'zzzz-future-decision.changeset.jsonl') -Lines $lines
}

$sentinelDbPath = Join-Path $env:TEMP 'lunav-harness-sync-sentinel.db'
$env:HARNESS_DB_PATH = $sentinelDbPath
try {
    & $verifier -SkipLocalParity | Out-Null
    if ($env:HARNESS_DB_PATH -ne $sentinelDbPath) {
        throw 'Verifier did not restore the caller-provided HARNESS_DB_PATH.'
    }
}
finally {
    Remove-Item Env:HARNESS_DB_PATH -ErrorAction SilentlyContinue
}

Write-Output 'PASS: caller HARNESS_DB_PATH restoration'

$windowsPowerShellOutput = & powershell -NoProfile -ExecutionPolicy Bypass -File $verifier `
    -SkipLocalParity 2>&1
if ($LASTEXITCODE -ne 0) {
    throw "Windows PowerShell verifier compatibility failed:`n$($windowsPowerShellOutput -join "`n")"
}

Write-Output 'PASS: Windows PowerShell verifier compatibility'

Write-Output 'Harness synchronization regression tests passed.'
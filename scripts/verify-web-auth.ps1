$ErrorActionPreference = "Stop"

Set-Location (Join-Path $PSScriptRoot "..")

function Invoke-Step {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Executable,
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    & $Executable @Arguments

    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

function Test-LocalSupabaseReady {
    $status = & supabase status --output env 2>$null
    if ($LASTEXITCODE -ne 0) {
        return $false
    }

    $environment = @{}
    foreach ($line in $status) {
        if ($line -match "^([^=]+)=(.*)$") {
            $value = $matches[2]
            if ($value.StartsWith('"') -and $value.EndsWith('"')) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            $environment[$matches[1]] = $value
        }
    }

    $mailpitUrl = $environment["MAILPIT_URL"]
    if (-not $mailpitUrl) {
        $mailpitUrl = $environment["INBUCKET_URL"]
    }

    if (-not $environment["API_URL"] -or -not $mailpitUrl) {
        return $false
    }

    try {
        $response = Invoke-WebRequest -Uri ($mailpitUrl.TrimEnd("/") + "/api/v1/messages?limit=1") -UseBasicParsing
        return $response.StatusCode -ge 200 -and $response.StatusCode -lt 300
    } catch {
        return $false
    }
}

$commands = @(
    @("pnpm", @("--filter", "@lunav/contracts", "test")),
    @("pnpm", @("--filter", "@lunav/web", "test")),
    @("pnpm", @("--filter", "@lunav/web", "typecheck")),
    @("pnpm", @("--filter", "@lunav/web", "lint")),
    @("pnpm", @("--filter", "@lunav/web", "build")),
    @("pnpm", @("security:client"))
)

foreach ($command in $commands) {
    Invoke-Step -Executable $command[0] -Arguments $command[1]
}

if (-not (Test-LocalSupabaseReady)) {
    Write-Error "Local Supabase/Mailpit is unavailable. Start the Lunav stack before the browser E2E gate."
    exit 1
}

Invoke-Step -Executable "pnpm" -Arguments @("--filter", "@lunav/web", "test:e2e")

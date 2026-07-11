$ErrorActionPreference = 'Stop'

$config = Get-Content -Raw (Join-Path $PSScriptRoot '..\supabase\config.toml')
$projectIdMatch = [regex]::Match($config, '(?m)^project_id\s*=\s*"([^"]+)"\s*$')

if (-not $projectIdMatch.Success) {
    throw 'Supabase project_id is required before resetting the profile database.'
}

$projectId = $projectIdMatch.Groups[1].Value
$realtimeContainer = "supabase_realtime_$projectId"
$kongContainer = "supabase_kong_$projectId"
$apiSectionMatch = [regex]::Match(
    $config,
    '(?ms)^\[api\][^\S\r\n]*(?:\r?\n|$)(?<body>.*?)(?=^\[|\z)'
)

if (-not $apiSectionMatch.Success) {
    throw 'Supabase API configuration is required before verifying Kong readiness.'
}

$apiPortMatch = [regex]::Match(
    $apiSectionMatch.Groups['body'].Value,
    '(?m)^port\s*=\s*(\d+)\s*$'
)

if (-not $apiPortMatch.Success) {
    throw 'Supabase API port is required before verifying Kong readiness.'
}

$authHealthUrl = "http://127.0.0.1:$($apiPortMatch.Groups[1].Value)/auth/v1/health"
$authHealthMaxAttempts = 20

docker container inspect $realtimeContainer *> $null

if ($LASTEXITCODE -eq 0) {
    docker stop $realtimeContainer | Out-Null

    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

pnpm dlx supabase@2.109.1 db reset --local

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

docker container inspect $kongContainer *> $null

if ($LASTEXITCODE -eq 0) {
    docker restart $kongContainer | Out-Null

    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }

    $isAuthReady = $false

    for ($attempt = 1; $attempt -le $authHealthMaxAttempts; $attempt++) {
        try {
            $response = Invoke-WebRequest -Uri $authHealthUrl -TimeoutSec 2
            $isAuthReady = $response.StatusCode -eq 200
        }
        catch {
            $isAuthReady = $false
        }

        if ($isAuthReady) {
            break
        }

        if ($attempt -lt $authHealthMaxAttempts) {
            Start-Sleep -Milliseconds 500
        }
    }

    if (-not $isAuthReady) {
        throw "Local Auth did not become ready through Kong after $authHealthMaxAttempts attempts."
    }
}

$commands = @(
    @('pnpm', @('--filter', '@lunav/contracts', 'test')),
    @('pnpm', @('--filter', '@lunav/contracts', 'typecheck')),
    @('pnpm', @('test:profile-integration')),
    @('pnpm', @('dlx', 'supabase@2.109.1', 'gen', 'types', 'typescript', '--local')),
    @('pnpm', @('lint')),
    @('pnpm', @('typecheck')),
    @('pnpm', @('test')),
    @('pnpm', @('security:client'))
)

foreach ($command in $commands) {
    $executable = $command[0]
    $arguments = $command[1]

    & $executable @arguments

    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}
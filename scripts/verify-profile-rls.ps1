$ErrorActionPreference = 'Stop'

$config = Get-Content -Raw (Join-Path $PSScriptRoot '..\supabase\config.toml')
$projectIdMatch = [regex]::Match($config, '(?m)^project_id\s*=\s*"([^"]+)"\s*$')

if (-not $projectIdMatch.Success) {
    throw 'Supabase project_id is required before resetting the profile database.'
}

$projectId = $projectIdMatch.Groups[1].Value
$realtimeContainer = "supabase_realtime_$projectId"
$kongContainer = "supabase_kong_$projectId"

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
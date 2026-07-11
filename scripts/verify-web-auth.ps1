$ErrorActionPreference = 'Stop'

Set-Location (Join-Path $PSScriptRoot '..')

$commands = @(
    @('pnpm', @('--filter', '@lunav/contracts', 'test')),
    @('pnpm', @('--filter', '@lunav/web', 'test')),
    @('pnpm', @('--filter', '@lunav/web', 'typecheck')),
    @('pnpm', @('--filter', '@lunav/web', 'lint')),
    @('pnpm', @('--filter', '@lunav/web', 'build')),
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
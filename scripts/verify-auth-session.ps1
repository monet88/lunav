$ErrorActionPreference = 'Stop'

$commands = @(
    @('pnpm', @('--filter', '@lunav/contracts', 'test')),
    @('pnpm', @('--filter', '@lunav/web', 'test')),
    @('pnpm', @('--filter', '@lunav/mobile', 'test')),
    @('pnpm', @('test:auth-integration')),
    @('pnpm', @('lint')),
    @('pnpm', @('typecheck')),
    @('pnpm', @('security:client')),
    @('pnpm', @('--filter', '@lunav/mobile', 'exec', 'expo', 'install', '--check'))
)

foreach ($command in $commands) {
    $executable = $command[0]
    $arguments = $command[1]

    & $executable @arguments

    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

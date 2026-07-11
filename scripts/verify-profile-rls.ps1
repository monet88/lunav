$ErrorActionPreference = 'Stop'

$commands = @(
    @('pnpm', @('--filter', '@lunav/contracts', 'test')),
    @('pnpm', @('--filter', '@lunav/contracts', 'typecheck')),
    @('pnpm', @('dlx', 'supabase@2.109.1', 'db', 'reset', '--local')),
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
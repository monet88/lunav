$ErrorActionPreference = 'Stop'

Set-Location (Join-Path $PSScriptRoot '..')

pnpm --filter @lunav/contracts test
pnpm --filter @lunav/web test
pnpm --filter @lunav/web typecheck
pnpm --filter @lunav/web lint
pnpm --filter @lunav/web build
pnpm security:client
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'

const root = resolve(import.meta.dirname, '../..')

test('declares apps and packages as pnpm workspaces', () => {
  const workspace = readFileSync(resolve(root, 'pnpm-workspace.yaml'), 'utf8')

  expect(workspace).toContain("- 'apps/*'")
  expect(workspace).toContain("- 'packages/*'")
})

test('defines the Foundation quality tasks', () => {
  const turbo = JSON.parse(readFileSync(resolve(root, 'turbo.json'), 'utf8'))

  expect(Object.keys(turbo.tasks)).toEqual(
    expect.arrayContaining(['lint', 'typecheck', 'test', 'build'])
  )
})

test('provides runtime source shims for contract JavaScript exports', () => {
  const contractsSource = resolve(root, 'packages/contracts/src')
  const contractsIndex = readFileSync(
    resolve(contractsSource, 'index.ts'),
    'utf8'
  )
  const exportedJavaScriptModules = [
    ...contractsIndex.matchAll(/from '\.\/([^']+)\.js'/g),
  ].map((match) => match[1])

  for (const moduleName of new Set(exportedJavaScriptModules)) {
    expect(existsSync(resolve(contractsSource, `${moduleName}.js`))).toBe(true)
  }
})

test('pins the Supabase CLI used by the profile integration gate', () => {
  const integrationScript = readFileSync(
    resolve(root, 'scripts/test-profile-rls-integration.mjs'),
    'utf8'
  )
  const powershellWrapper = readFileSync(
    resolve(root, 'scripts/verify-profile-rls.ps1'),
    'utf8'
  )
  const shellWrapper = readFileSync(
    resolve(root, 'scripts/verify-profile-rls.sh'),
    'utf8'
  )

  expect(integrationScript).toContain("process.platform === 'win32'")
  expect(integrationScript).toContain('process.env.ComSpec')
  expect(integrationScript).toContain("'/d'")
  expect(integrationScript).toContain("'/s'")
  expect(integrationScript).toContain("'/c'")
  expect(integrationScript).not.toContain('shell: true')
  expect(integrationScript).toContain("'supabase@2.109.1'")
  expect(integrationScript).toMatch(
    /spawnSync\(\s*executable,\s*arguments_,/
  )
  expect(powershellWrapper).toContain("'supabase@2.109.1'")
  expect(shellWrapper).toContain('supabase@2.109.1')
})

test('preserves database timestamp precision and cleans every profile fixture', () => {
  const integrationScript = readFileSync(
    resolve(root, 'scripts/test-profile-rls-integration.mjs'),
    'utf8'
  )

  expect(integrationScript).toContain(
    'ownerUpdate.body[0].updated_at === initialUpdatedAt'
  )
  expect(integrationScript).toContain(
    "typeof ownerUpdate.body[0].updated_at !== 'string'"
  )
  expect(integrationScript).toContain(
    'Number.isNaN(Date.parse(ownerUpdate.body[0].updated_at))'
  )
  expect(integrationScript).not.toContain(
    'new Date(ownerUpdate.body[0].updated_at)'
  )
  expect(integrationScript).toMatch(
    /Promise\.allSettled\(\s*users\.map/
  )
  expect(integrationScript).toContain('primaryFailure')
  expect(integrationScript).toContain('new AggregateError')
  expect(integrationScript).toContain('error.errors.map(formatError)')
  expect(integrationScript).toContain('Auth fixture ${userId}')
})

test('quiesces local Realtime before the profile database reset', () => {
  const powershellWrapper = readFileSync(
    resolve(root, 'scripts/verify-profile-rls.ps1'),
    'utf8'
  )
  const shellWrapper = readFileSync(
    resolve(root, 'scripts/verify-profile-rls.sh'),
    'utf8'
  )

  expect(powershellWrapper).toContain('supabase_realtime_$projectId')
  expect(powershellWrapper).toContain('docker stop $realtimeContainer')
  expect(shellWrapper).toContain('supabase_realtime_${project_id}')
  expect(shellWrapper).toContain('docker stop')

  expect(
    powershellWrapper.indexOf('docker stop $realtimeContainer')
  ).toBeLessThan(
    powershellWrapper.indexOf('pnpm dlx supabase@2.109.1 db reset --local')
  )
  expect(
    shellWrapper.indexOf('run docker stop "$realtime_container"')
  ).toBeLessThan(
    shellWrapper.indexOf('run pnpm dlx supabase@2.109.1 db reset --local')
  )
})

test('refreshes the local gateway after the profile database reset', () => {
  const powershellWrapper = readFileSync(
    resolve(root, 'scripts/verify-profile-rls.ps1'),
    'utf8'
  )
  const shellWrapper = readFileSync(
    resolve(root, 'scripts/verify-profile-rls.sh'),
    'utf8'
  )

  expect(powershellWrapper).toContain('supabase_kong_$projectId')
  expect(powershellWrapper).toContain('docker restart $kongContainer')
  expect(shellWrapper).toContain('supabase_kong_${project_id}')
  expect(shellWrapper).toContain('run docker restart "$kong_container"')

  const powershellResetIndex = powershellWrapper.indexOf(
    'pnpm dlx supabase@2.109.1 db reset --local'
  )
  const powershellRestartIndex = powershellWrapper.indexOf(
    'docker restart $kongContainer'
  )
  const powershellIntegrationIndex = powershellWrapper.indexOf(
    "@('pnpm', @('test:profile-integration'))"
  )
  const shellResetIndex = shellWrapper.indexOf(
    'run pnpm dlx supabase@2.109.1 db reset --local'
  )
  const shellRestartIndex = shellWrapper.indexOf(
    'run docker restart "$kong_container"'
  )
  const shellIntegrationIndex = shellWrapper.indexOf(
    'run pnpm test:profile-integration'
  )

  expect(powershellResetIndex).toBeLessThan(powershellRestartIndex)
  expect(powershellRestartIndex).toBeLessThan(powershellIntegrationIndex)
  expect(shellResetIndex).toBeLessThan(shellRestartIndex)
  expect(shellRestartIndex).toBeLessThan(shellIntegrationIndex)

  const powershellReadiness = powershellWrapper.slice(
    powershellRestartIndex,
    powershellIntegrationIndex
  )
  const shellReadiness = shellWrapper.slice(
    shellRestartIndex,
    shellIntegrationIndex
  )

  expect(powershellWrapper).toContain('/auth/v1/health')
  expect(powershellWrapper).toContain('$apiSectionMatch')
  expect(powershellWrapper).toContain(".Groups['body'].Value")
  expect(powershellWrapper).not.toContain(
    "'(?ms)^\\[api\\]\\s*.*?^port"
  )
  expect(powershellReadiness).toContain('$authHealthMaxAttempts')
  expect(powershellReadiness).toContain('Invoke-WebRequest')
  expect(shellWrapper).toContain('/auth/v1/health')
  expect(shellReadiness).toContain('auth_health_max_attempts')
  expect(shellReadiness).toContain('curl --fail')
})

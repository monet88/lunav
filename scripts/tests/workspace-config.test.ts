import { readFileSync } from 'node:fs'
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

  expect(integrationScript).toMatch(/spawnSync\(\s*'pnpm'/)
  expect(integrationScript).toContain("'supabase@2.109.1'")
  expect(powershellWrapper).toContain("'supabase@2.109.1'")
  expect(shellWrapper).toContain('supabase@2.109.1')
})
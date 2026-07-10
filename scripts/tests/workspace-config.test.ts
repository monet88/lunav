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
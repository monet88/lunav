import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'

const root = resolve(import.meta.dirname, '../..')

test('defines a pull-request CI workflow with Foundation gates', () => {
  const workflow = readFileSync(
    resolve(root, '.github/workflows/ci.yml'),
    'utf8'
  )

  expect(workflow).toContain('pull_request:')
  expect(workflow).toContain('pnpm/action-setup@v4')
  expect(workflow).toContain('actions/setup-node@v4')
  expect(workflow).toContain('cache: pnpm')
  expect(workflow).toMatch(/- run: pnpm install --frozen-lockfile/)
  expect(workflow).toMatch(/- run: pnpm lint/)
  expect(workflow).toMatch(/- run: pnpm typecheck/)
  expect(workflow).toMatch(/- run: pnpm test/)
  expect(workflow).toMatch(/- run: pnpm build/)
  expect(workflow).toMatch(/- run: pnpm security:client/)
})
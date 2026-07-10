import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'

const root = resolve(import.meta.dirname, '../..')

test('ignores local dotenv files while preserving public examples', () => {
  const rootIgnore = readFileSync(resolve(root, '.gitignore'), 'utf8')
  const webIgnore = readFileSync(resolve(root, 'apps/web/.gitignore'), 'utf8')
  const mobileIgnore = readFileSync(
    resolve(root, 'apps/mobile/.gitignore'),
    'utf8'
  )

  expect(rootIgnore).toContain('.env*')
  expect(rootIgnore).toContain('!.env.example')
  expect(webIgnore).toContain('!.env.example')
  expect(mobileIgnore).toContain('!.env.example')
  expect(existsSync(resolve(root, 'apps/web/.env.example'))).toBe(true)
  expect(existsSync(resolve(root, 'apps/mobile/.env.example'))).toBe(true)
})
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'

const root = resolve(import.meta.dirname, '../..')

function activeIgnoreRules(contents: string) {
  return contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
}

test('ignores local dotenv files while preserving public examples', () => {
  const rootIgnore = readFileSync(resolve(root, '.gitignore'), 'utf8')
  const webIgnore = readFileSync(resolve(root, 'apps/web/.gitignore'), 'utf8')
  const mobileIgnore = readFileSync(
    resolve(root, 'apps/mobile/.gitignore'),
    'utf8'
  )

  expect(activeIgnoreRules(rootIgnore)).toEqual(
    expect.arrayContaining(['.env*', '!.env.example'])
  )
  expect(activeIgnoreRules(webIgnore)).toContain('!.env.example')
  expect(activeIgnoreRules(mobileIgnore)).toContain('!.env.example')
  expect(existsSync(resolve(root, 'apps/web/.env.example'))).toBe(true)
  expect(existsSync(resolve(root, 'apps/mobile/.env.example'))).toBe(true)
})
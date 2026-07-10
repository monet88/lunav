import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, test } from 'vitest'
import {
  findForbiddenClientSecrets,
  scanClientFiles,
} from './check-client-secrets.mjs'

describe('findForbiddenClientSecrets', () => {
  test('reports a Supabase service-role key', () => {
    expect(
      findForbiddenClientSecrets('const serviceRoleKey = "secret"')
    ).toEqual(['serviceRoleKey'])
  })

  test('allows a public Supabase URL', () => {
    expect(
      findForbiddenClientSecrets(
        'const url = process.env.NEXT_PUBLIC_SUPABASE_URL'
      )
    ).toEqual([])
  })

  test('reports the path containing a forbidden client secret', () => {
    const rootDirectory = mkdtempSync(join(tmpdir(), 'lunav-client-secret-'))
    const appDirectory = join(rootDirectory, 'apps', 'web')

    mkdirSync(appDirectory, { recursive: true })
    writeFileSync(
      join(appDirectory, 'client.ts'),
      'const serviceRoleKey = "secret"'
    )

    expect(scanClientFiles(rootDirectory)).toEqual([
      {
        path: 'apps/web/client.ts',
        matches: ['serviceRoleKey'],
      },
    ])
  })

  test('reports a forbidden secret in a shared package', () => {
    const rootDirectory = mkdtempSync(join(tmpdir(), 'lunav-client-secret-'))
    const packageDirectory = join(rootDirectory, 'packages', 'config', 'src')

    mkdirSync(packageDirectory, { recursive: true })
    writeFileSync(
      join(packageDirectory, 'public-supabase.ts'),
      'const serviceRoleKey = "secret"'
    )

    expect(scanClientFiles(rootDirectory)).toEqual([
      {
        path: 'packages/config/src/public-supabase.ts',
        matches: ['serviceRoleKey'],
      },
    ])
  })

  test('allows a shared validator to reject a server-only field', () => {
    const rootDirectory = mkdtempSync(join(tmpdir(), 'lunav-client-secret-'))
    const packageDirectory = join(rootDirectory, 'packages', 'config', 'src')

    mkdirSync(packageDirectory, { recursive: true })
    writeFileSync(
      join(packageDirectory, 'public-supabase.ts'),
      "if ('serviceRoleKey' in input) throw new Error('server-only')"
    )

    expect(scanClientFiles(rootDirectory)).toEqual([])
  })

  test('ignores credential-shaped fixtures in test files', () => {
    const rootDirectory = mkdtempSync(join(tmpdir(), 'lunav-client-secret-'))
    const packageDirectory = join(rootDirectory, 'packages', 'config', 'src')

    mkdirSync(packageDirectory, { recursive: true })
    writeFileSync(
      join(packageDirectory, 'public-supabase.test.ts'),
      'const serviceRoleKey = "test-secret"'
    )

    expect(scanClientFiles(rootDirectory)).toEqual([])
  })

  test('ignores generated Next.js build artifacts', () => {
    const rootDirectory = mkdtempSync(join(tmpdir(), 'lunav-client-secret-'))
    const buildDirectory = join(rootDirectory, 'apps', 'web', '.next')

    mkdirSync(buildDirectory, { recursive: true })
    writeFileSync(
      join(buildDirectory, 'server.js'),
      'const serviceRoleKey = "generated"'
    )

    expect(scanClientFiles(rootDirectory)).toEqual([])
  })

  test('reports a forbidden credential in a committed environment example', () => {
    const rootDirectory = mkdtempSync(join(tmpdir(), 'lunav-client-secret-'))

    writeFileSync(
      join(rootDirectory, '.env.example'),
      'SUPABASE_SERVICE_ROLE_KEY=secret'
    )

    expect(scanClientFiles(rootDirectory)).toEqual([
      {
        path: '.env.example',
        matches: ['SUPABASE_SERVICE_ROLE_KEY'],
      },
    ])
  })
})
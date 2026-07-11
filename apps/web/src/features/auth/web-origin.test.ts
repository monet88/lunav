import { afterEach, describe, expect, test, vi } from 'vitest'
import { getWebOrigin } from './web-origin'

describe('getWebOrigin', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test('returns the configured canonical origin', () => {
    expect(getWebOrigin({ WEB_ORIGIN: 'https://app.lunav.vn' })).toBe(
      'https://app.lunav.vn'
    )
  })

  test('rejects an origin with a path or credentials in non-production', () => {
    expect(() =>
      getWebOrigin({ WEB_ORIGIN: 'https://name:secret@app.lunav.vn' })
    ).toThrow(/WEB_ORIGIN/)
  })

  test('requires HTTPS in production', () => {
    vi.stubEnv('NODE_ENV', 'production')

    expect(() =>
      getWebOrigin({ WEB_ORIGIN: 'http://app.lunav.vn' })
    ).toThrow(/WEB_ORIGIN/)
  })

  test('requires an explicit origin in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('WEB_ORIGIN', '')

    expect(() => getWebOrigin({})).toThrow(/WEB_ORIGIN/)
  })

  test('defaults to the local development origin when unset outside production', () => {
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('WEB_ORIGIN', '')

    expect(getWebOrigin({})).toBe('http://127.0.0.1:3000')
  })
})

import { describe, expect, test } from 'vitest'
import {
  normalizeAuthIdentity,
  normalizeAuthState,
  parseAuthReturnDestination,
} from './auth.js'

describe('normalizeAuthIdentity', () => {
  test('returns a canonical identity from a confirmed Supabase user shape', () => {
    expect(
      normalizeAuthIdentity({
        id: 'user_123',
        email: 'person@example.com',
        email_confirmed_at: '2026-07-11T10:30:00.000Z',
      })
    ).toEqual({
      userId: 'user_123',
      email: 'person@example.com',
      isEmailConfirmed: true,
    })
  })

  test('omits raw token-like fields from the returned identity', () => {
    expect(
      normalizeAuthIdentity({
        id: 'user_456',
        email: 'private@example.com',
        email_confirmed_at: null,
        access_token: 'access-secret',
        refresh_token: 'refresh-secret',
        provider_token: 'provider-secret',
      })
    ).toEqual({
      userId: 'user_456',
      email: 'private@example.com',
      isEmailConfirmed: false,
    })
  })

  test('rejects a missing email', () => {
    expect(() =>
      normalizeAuthIdentity({
        id: 'user_789',
        email_confirmed_at: null,
      })
    ).toThrow()
  })

  test('rejects an invalid email syntax', () => {
    expect(() =>
      normalizeAuthIdentity({
        id: 'user_invalid_email',
        email: 'not-an-email',
        email_confirmed_at: null,
      })
    ).toThrow()
  })

  test('rejects a malformed user id', () => {
    expect(() =>
      normalizeAuthIdentity({
        id: '   ',
        email: 'person@example.com',
        email_confirmed_at: null,
      })
    ).toThrow()
  })

  test('rejects an invalid confirmation timestamp', () => {
    expect(() =>
      normalizeAuthIdentity({
        id: 'user_invalid_confirmation',
        email: 'person@example.com',
        email_confirmed_at: 'not-a-datetime',
      })
    ).toThrow()
  })
})

describe('normalizeAuthState', () => {
  test('returns loading unchanged', () => {
    expect(normalizeAuthState('loading')).toEqual({ status: 'loading' })
  })

  test('returns anonymous when no user is present', () => {
    expect(normalizeAuthState(null)).toEqual({ status: 'anonymous' })
  })

  test('returns unconfirmed when the user email is not confirmed', () => {
    expect(
      normalizeAuthState({
        id: 'user_unconfirmed',
        email: 'pending@example.com',
        email_confirmed_at: null,
      })
    ).toEqual({
      status: 'unconfirmed',
      identity: {
        userId: 'user_unconfirmed',
        email: 'pending@example.com',
        isEmailConfirmed: false,
      },
    })
  })

  test('returns authenticated when the user email is confirmed', () => {
    expect(
      normalizeAuthState({
        id: 'user_confirmed',
        email: 'ready@example.com',
        email_confirmed_at: '2026-07-11T10:30:00.000Z',
      })
    ).toEqual({
      status: 'authenticated',
      identity: {
        userId: 'user_confirmed',
        email: 'ready@example.com',
        isEmailConfirmed: true,
      },
    })
  })
})

describe('parseAuthReturnDestination', () => {
  test('returns the canonical account route', () => {
    expect(parseAuthReturnDestination('/account')).toBe('/account')
  })

  test('rejects whitespace around an otherwise allowed route', () => {
    expect(parseAuthReturnDestination(' /account')).toBe('/')
  })

  test('returns the canonical account route for an internal absolute URL', () => {
    expect(
      parseAuthReturnDestination('https://app.lunav.vn/account')
    ).toBe('/account')
  })

  test('rejects queries on an otherwise allowed route', () => {
    expect(parseAuthReturnDestination('/account?tab=security')).toBe('/')
  })

  test('rejects an absolute external URL', () => {
    expect(parseAuthReturnDestination('https://evil.example/account')).toBe('/')
  })

  test('rejects a protocol-looking value', () => {
    expect(parseAuthReturnDestination('javascript:alert(1)')).toBe('/')
  })

  test('rejects a protocol-relative destination', () => {
    expect(parseAuthReturnDestination('//evil.example/account')).toBe('/')
  })

  test('rejects a literal backslash in the destination', () => {
    expect(parseAuthReturnDestination('/\\account')).toBe('/')
  })

  test('rejects an encoded backslash in the destination', () => {
    expect(parseAuthReturnDestination('/%5Caccount')).toBe('/')
  })

  test('rejects an encoded slash in the destination', () => {
    expect(parseAuthReturnDestination('/%2Faccount')).toBe('/')
  })

  test('rejects decoded control characters in the destination', () => {
    expect(parseAuthReturnDestination('/account%0A')).toBe('/')
  })

  test('rejects literal control characters in the destination', () => {
    expect(parseAuthReturnDestination('/account\n')).toBe('/')
  })

  test('rejects malformed percent encoding', () => {
    expect(parseAuthReturnDestination('/account%ZZ')).toBe('/')
  })

  test('rejects an arbitrary path', () => {
    expect(parseAuthReturnDestination('/settings')).toBe('/')
  })
})

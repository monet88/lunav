import type { AuthState } from '@lunav/contracts'
import {
  canAccessPrivateShell,
  canAccessPublicAuthShell,
  isAuthBootLoading,
  resolveAuthEntryDestination,
} from './auth-shell'

const loading: AuthState = { status: 'loading' }
const anonymous: AuthState = { status: 'anonymous' }
const unconfirmed: AuthState = {
  status: 'unconfirmed',
  identity: {
    userId: 'user-b',
    email: 'b@example.com',
    isEmailConfirmed: false,
  },
}
const authenticated: AuthState = {
  status: 'authenticated',
  identity: {
    userId: 'user-a',
    email: 'a@example.com',
    isEmailConfirmed: true,
  },
}

describe('auth shell navigation guards', () => {
  test('loading never opens private content', () => {
    expect(isAuthBootLoading(loading)).toBe(true)
    expect(canAccessPrivateShell(loading)).toBe(false)
    expect(canAccessPublicAuthShell(loading)).toBe(false)
    expect(resolveAuthEntryDestination(loading)).toBeNull()
  })

  test('anonymous users stay in the public auth shell', () => {
    expect(isAuthBootLoading(anonymous)).toBe(false)
    expect(canAccessPrivateShell(anonymous)).toBe(false)
    expect(canAccessPublicAuthShell(anonymous)).toBe(true)
    expect(resolveAuthEntryDestination(anonymous)).toBe('/(auth)')
  })

  test('unconfirmed sessions stay in the public auth shell', () => {
    expect(canAccessPrivateShell(unconfirmed)).toBe(false)
    expect(canAccessPublicAuthShell(unconfirmed)).toBe(true)
    expect(resolveAuthEntryDestination(unconfirmed)).toBe('/(auth)')
  })

  test('confirmed authenticated users enter the private shell', () => {
    expect(canAccessPrivateShell(authenticated)).toBe(true)
    expect(canAccessPublicAuthShell(authenticated)).toBe(false)
    expect(resolveAuthEntryDestination(authenticated)).toBe('/(protected)')
  })
})

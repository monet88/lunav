import type { AuthState } from '@lunav/contracts'
import {
  canAccessPrivateShell,
  canAccessPublicAuthShell,
  isAuthBootLoading,
  resolveAuthEntryDestination,
} from '@/features/auth/auth-shell'
import { resolveMobileSignInHref } from '@/features/auth/return-path'

/**
 * Mirrors root Stack.Protected guards without mounting Expo Router.
 * Ensures private content is never eligible while loading.
 */
function resolveShellEligibility(state: AuthState): {
  privateEligible: boolean
  publicEligible: boolean
  showsLoadingSurface: boolean
} {
  return {
    privateEligible: canAccessPrivateShell(state),
    publicEligible: canAccessPublicAuthShell(state),
    showsLoadingSurface: isAuthBootLoading(state),
  }
}

/**
 * Post sign-in navigation is only safe once the session controller has
 * published authenticated. Password success + href alone is not enough.
 */
function canCompleteProtectedEntry(
  authState: AuthState,
  signInKind: 'signed-in' | 'error'
): boolean {
  return signInKind === 'signed-in' && canAccessPrivateShell(authState)
}

describe('protected navigation shell eligibility', () => {
  test('loading keeps both shells closed so private content cannot flash', () => {
    expect(resolveShellEligibility({ status: 'loading' })).toEqual({
      privateEligible: false,
      publicEligible: false,
      showsLoadingSurface: true,
    })
  })

  test('anonymous only opens the public auth shell', () => {
    expect(resolveShellEligibility({ status: 'anonymous' })).toEqual({
      privateEligible: false,
      publicEligible: true,
      showsLoadingSurface: false,
    })
  })

  test('unconfirmed only opens the public auth shell', () => {
    expect(
      resolveShellEligibility({
        status: 'unconfirmed',
        identity: {
          userId: 'user-b',
          email: 'b@example.com',
          isEmailConfirmed: false,
        },
      })
    ).toEqual({
      privateEligible: false,
      publicEligible: true,
      showsLoadingSurface: false,
    })
  })

  test('authenticated only opens the private shell', () => {
    expect(
      resolveShellEligibility({
        status: 'authenticated',
        identity: {
          userId: 'user-a',
          email: 'a@example.com',
          isEmailConfirmed: true,
        },
      })
    ).toEqual({
      privateEligible: true,
      publicEligible: false,
      showsLoadingSurface: false,
    })
  })
})

describe('sign-in protected entry coupling', () => {
  const privateHref = resolveMobileSignInHref('/account')

  test('resolved post-sign-in href is always the private shell entry', () => {
    expect(privateHref).toBe('/(protected)')
    expect(resolveMobileSignInHref(undefined)).toBe('/(protected)')
    expect(resolveMobileSignInHref('https://evil.example')).toBe('/(protected)')
  })

  test('signed-in alone does not complete entry while session is still anonymous', () => {
    expect(canCompleteProtectedEntry({ status: 'anonymous' }, 'signed-in')).toBe(
      false
    )
    expect(resolveAuthEntryDestination({ status: 'anonymous' })).toBe('/(auth)')
  })

  test('signed-in alone does not complete entry while session is unconfirmed', () => {
    const unconfirmed: AuthState = {
      status: 'unconfirmed',
      identity: {
        userId: 'user-b',
        email: 'b@example.com',
        isEmailConfirmed: false,
      },
    }

    expect(canCompleteProtectedEntry(unconfirmed, 'signed-in')).toBe(false)
    expect(canAccessPrivateShell(unconfirmed)).toBe(false)
    expect(resolveAuthEntryDestination(unconfirmed)).toBe('/(auth)')
  })

  test('entry completes only when signed-in coincides with authenticated state', () => {
    const authenticated: AuthState = {
      status: 'authenticated',
      identity: {
        userId: 'user-a',
        email: 'a@example.com',
        isEmailConfirmed: true,
      },
    }

    expect(canCompleteProtectedEntry(authenticated, 'signed-in')).toBe(true)
    expect(canCompleteProtectedEntry(authenticated, 'error')).toBe(false)
    expect(resolveAuthEntryDestination(authenticated)).toBe('/(protected)')
    expect(privateHref).toBe(resolveAuthEntryDestination(authenticated))
  })
})

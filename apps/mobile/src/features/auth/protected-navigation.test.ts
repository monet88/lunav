import type { AuthState } from '@lunav/contracts'
import {
  canAccessPrivateShell,
  canAccessPublicAuthShell,
  isAuthBootLoading,
} from '@/features/auth/auth-shell'

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

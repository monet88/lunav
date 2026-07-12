import type { AuthState } from '@lunav/contracts'

export type AuthShellDestination = '/(auth)' | '/(protected)'

/**
 * Private routes require a confirmed authenticated session only.
 * Loading must never open private content.
 */
export function canAccessPrivateShell(state: AuthState): boolean {
  return state.status === 'authenticated'
}

/**
 * Public auth shell is available once boot finished and the user is not
 * confirmed-authenticated. Unconfirmed sessions stay public.
 */
export function canAccessPublicAuthShell(state: AuthState): boolean {
  return state.status !== 'loading' && state.status !== 'authenticated'
}

export function isAuthBootLoading(state: AuthState): boolean {
  return state.status === 'loading'
}

/**
 * Entry redirect target after auth boot resolves.
 * Loading has no destination — callers must keep a safe loading surface.
 */
export function resolveAuthEntryDestination(
  state: AuthState
): AuthShellDestination | null {
  if (state.status === 'loading') {
    return null
  }

  if (state.status === 'authenticated') {
    return '/(protected)'
  }

  return '/(auth)'
}

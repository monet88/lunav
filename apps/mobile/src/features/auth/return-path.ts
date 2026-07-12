import { parseAuthReturnDestination } from '@lunav/contracts'

/**
 * Mobile post-sign-in href inside Expo Router.
 * Account settings (#10) will live under the protected group; for this slice the
 * only safe landing is the private shell entry.
 */
export type MobilePostSignInHref = '/(protected)'

/**
 * Validate a raw return destination, then map it to a local Expo href.
 * Unapproved destinations fall back safely — never open external or public
 * deep-link targets after a successful sign-in.
 */
export function resolveMobileSignInHref(
  rawReturnTo: string | undefined
): MobilePostSignInHref {
  // Shared contract collapses open redirects / query / encoded tricks to `/`
  // or the canonical `/account` path only.
  const destination = parseAuthReturnDestination(rawReturnTo ?? '')

  if (destination === '/account') {
    return '/(protected)'
  }

  // Fallback root still lands in the private shell: a confirmed session was
  // just established and public auth routes must not remain the post-login home.
  return '/(protected)'
}
